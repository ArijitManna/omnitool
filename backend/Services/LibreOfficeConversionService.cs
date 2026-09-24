using System.Diagnostics;
using System.Text;

namespace OmniFile.Api.Services;

public sealed class LibreOfficeOptions
{
    /// <summary>Optional explicit path to soffice.exe / soffice.</summary>
    public string? ExecutablePath { get; set; }

    /// <summary>Conversion timeout in seconds.</summary>
    public int TimeoutSeconds { get; set; } = 120;
}

public sealed class LibreOfficeConversionService
{
    private readonly TempFileService _tempFiles;
    private readonly ILogger<LibreOfficeConversionService> _logger;
    private readonly LibreOfficeOptions _options;
    private readonly string? _resolvedExe;

    public LibreOfficeConversionService(
        TempFileService tempFiles,
        IConfiguration config,
        ILogger<LibreOfficeConversionService> logger)
    {
        _tempFiles = tempFiles;
        _logger = logger;
        _options = config.GetSection("LibreOffice").Get<LibreOfficeOptions>() ?? new LibreOfficeOptions();
        _resolvedExe = ResolveExecutable(_options.ExecutablePath);
    }

    public bool IsAvailable => !string.IsNullOrWhiteSpace(_resolvedExe);

    public string? ExecutablePath => _resolvedExe;

    public async Task<byte[]> ConvertToPdfAsync(Stream input, string originalFileName, CancellationToken cancellationToken)
    {
        if (!IsAvailable || _resolvedExe is null)
        {
            throw new InvalidOperationException(
                "LibreOffice is not installed or not configured. Install LibreOffice and restart the API, or set LibreOffice:ExecutablePath in appsettings.");
        }

        var jobPath = _tempFiles.CreateJobDirectory();
        var profilePath = Path.Combine(jobPath, "lo-profile");
        Directory.CreateDirectory(profilePath);

        try
        {
            var safeName = SanitizeFileName(originalFileName);
            var inputPath = Path.Combine(jobPath, safeName);
            await using (var fs = File.Create(inputPath))
            {
                await input.CopyToAsync(fs, cancellationToken);
            }

            var profileUri = ToFileUri(profilePath);
            var args =
                $"--headless --nologo --nofirststartwizard --norestore " +
                $"-env:UserInstallation={profileUri} " +
                $"--convert-to pdf --outdir \"{jobPath}\" \"{inputPath}\"";

            _logger.LogInformation("LibreOffice convert: {Exe} {Args}", _resolvedExe, args);

            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = _resolvedExe,
                    Arguments = args,
                    WorkingDirectory = jobPath,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                },
            };

            var stdout = new StringBuilder();
            var stderr = new StringBuilder();
            process.OutputDataReceived += (_, e) => { if (e.Data is not null) stdout.AppendLine(e.Data); };
            process.ErrorDataReceived += (_, e) => { if (e.Data is not null) stderr.AppendLine(e.Data); };

            if (!process.Start())
            {
                throw new InvalidOperationException("Failed to start LibreOffice.");
            }

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(30, _options.TimeoutSeconds)));

            try
            {
                await process.WaitForExitAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                TryKill(process);
                throw new TimeoutException("LibreOffice conversion timed out.");
            }

            if (process.ExitCode != 0)
            {
                _logger.LogWarning(
                    "LibreOffice exit {Code}. stdout={Stdout} stderr={Stderr}",
                    process.ExitCode,
                    stdout,
                    stderr);
                throw new InvalidOperationException(
                    "LibreOffice failed to convert the document. Ensure the file is a valid Office document.");
            }

            var expectedPdf = Path.Combine(jobPath, Path.ChangeExtension(safeName, ".pdf"));
            var pdfPath = File.Exists(expectedPdf)
                ? expectedPdf
                : Directory.EnumerateFiles(jobPath, "*.pdf").FirstOrDefault();

            if (pdfPath is null || !File.Exists(pdfPath))
            {
                throw new InvalidOperationException(
                    "Conversion finished but no PDF was produced. Check LibreOffice installation.");
            }

            return await File.ReadAllBytesAsync(pdfPath, cancellationToken);
        }
        finally
        {
            _tempFiles.DeleteJobDirectory(jobPath);
        }
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
        }
        catch
        {
            /* ignore */
        }
    }

    private static string? ResolveExecutable(string? configured)
    {
        if (!string.IsNullOrWhiteSpace(configured) && File.Exists(configured))
        {
            return configured;
        }

        var candidates = new List<string>();

        var env = Environment.GetEnvironmentVariable("LIBREOFFICE_PATH");
        if (!string.IsNullOrWhiteSpace(env))
        {
            candidates.Add(env);
        }

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

        candidates.AddRange(
        [
            Path.Combine(programFiles, "LibreOffice", "program", "soffice.exe"),
            Path.Combine(programFilesX86, "LibreOffice", "program", "soffice.exe"),
            @"C:\Program Files\LibreOffice\program\soffice.exe",
            @"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            "/usr/bin/soffice",
            "/usr/lib/libreoffice/program/soffice",
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        ]);

        // PATH lookup
        var pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in pathEnv.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            candidates.Add(Path.Combine(dir, "soffice.exe"));
            candidates.Add(Path.Combine(dir, "soffice"));
        }

        return candidates.FirstOrDefault(File.Exists);
    }

    private static string SanitizeFileName(string name)
    {
        var fileName = Path.GetFileName(name);
        foreach (var c in Path.GetInvalidFileNameChars())
        {
            fileName = fileName.Replace(c, '_');
        }

        return string.IsNullOrWhiteSpace(fileName) ? "document.docx" : fileName;
    }

    /// <summary>LibreOffice UserInstallation expects a file:/// URI.</summary>
    private static string ToFileUri(string absolutePath)
    {
        var full = Path.GetFullPath(absolutePath).Replace('\\', '/');
        if (!full.StartsWith('/'))
        {
            full = "/" + full;
        }

        return "file://" + full;
    }
}
