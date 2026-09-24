namespace OmniFile.Api.Services;

public sealed class TempFileService
{
    private readonly string _root;
    private readonly ILogger<TempFileService> _logger;

    public TempFileService(IWebHostEnvironment env, ILogger<TempFileService> logger)
    {
        _logger = logger;
        _root = Path.Combine(env.ContentRootPath, "App_Data", "temp");
        Directory.CreateDirectory(_root);
    }

    public string Root => _root;

    public string CreateJobDirectory()
    {
        var jobId = Guid.NewGuid().ToString("N");
        var path = Path.Combine(_root, jobId);
        Directory.CreateDirectory(path);
        return path;
    }

    public void DeleteJobDirectory(string jobPath)
    {
        try
        {
            if (Directory.Exists(jobPath))
            {
                Directory.Delete(jobPath, recursive: true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete temp job directory {Path}", jobPath);
        }
    }

    public int CleanupOlderThan(TimeSpan maxAge)
    {
        var cutoff = DateTime.UtcNow - maxAge;
        var removed = 0;

        if (!Directory.Exists(_root))
        {
            return 0;
        }

        foreach (var dir in Directory.EnumerateDirectories(_root))
        {
            try
            {
                var created = Directory.GetCreationTimeUtc(dir);
                if (created < cutoff)
                {
                    Directory.Delete(dir, recursive: true);
                    removed++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clean orphan temp directory {Path}", dir);
            }
        }

        return removed;
    }
}
