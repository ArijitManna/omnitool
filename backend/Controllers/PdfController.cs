using System.IO.Compression;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using OmniFile.Api.Services;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace OmniFile.Api.Controllers;

[ApiController]
[Route("api/pdf")]
public sealed class PdfController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/octet-stream"
    };

    private const long MaxFileBytes = 100 * 1024 * 1024;

    private readonly TempFileService _tempFiles;
    private readonly ILogger<PdfController> _logger;

    public PdfController(TempFileService tempFiles, ILogger<PdfController> logger)
    {
        _tempFiles = tempFiles;
        _logger = logger;
    }

    /// <summary>
    /// Merge multiple PDF files into one. Temps are deleted after the response is prepared.
    /// </summary>
    [HttpPost("merge")]
    [RequestSizeLimit(MaxFileBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileBytes)]
    public async Task<IActionResult> Merge([FromForm] List<IFormFile>? files, CancellationToken cancellationToken)
    {
        if (files is null || files.Count < 2)
        {
            return BadRequest(new { error = "Upload at least two PDF files to merge." });
        }

        foreach (var file in files)
        {
            var validationError = ValidatePdf(file);
            if (validationError is not null)
            {
                return BadRequest(new { error = validationError });
            }
        }

        var jobPath = _tempFiles.CreateJobDirectory();
        var savedPaths = new List<string>();

        try
        {
            for (var i = 0; i < files.Count; i++)
            {
                var file = files[i];
                var safeName = $"{i:D3}_{SanitizeFileName(file.FileName)}";
                var path = Path.Combine(jobPath, safeName);

                await using (var stream = System.IO.File.Create(path))
                {
                    await file.CopyToAsync(stream, cancellationToken);
                }

                savedPaths.Add(path);
            }

            using var outputDocument = new PdfDocument();

            foreach (var path in savedPaths)
            {
                using var input = PdfReader.Open(path, PdfDocumentOpenMode.Import);
                for (var pageIndex = 0; pageIndex < input.PageCount; pageIndex++)
                {
                    outputDocument.AddPage(input.Pages[pageIndex]);
                }
            }

            var pageCount = outputDocument.PageCount;
            if (pageCount == 0)
            {
                return BadRequest(new { error = "No pages found in the uploaded PDFs." });
            }

            await using var memory = new MemoryStream();
            outputDocument.Save(memory, false);
            var bytes = memory.ToArray();

            _logger.LogInformation(
                "Merged {FileCount} PDFs into {PageCount} pages ({Bytes} bytes)",
                files.Count,
                pageCount,
                bytes.Length);

            return File(bytes, "application/pdf", "merged.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF merge failed");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Failed to merge PDFs. Ensure each file is a valid, non-encrypted PDF."
            });
        }
        finally
        {
            _tempFiles.DeleteJobDirectory(jobPath);
        }
    }

    /// <summary>
    /// Split a PDF into multiple files (ZIP). Modes: each | chunk | ranges.
    /// </summary>
    [HttpPost("split")]
    [RequestSizeLimit(MaxFileBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileBytes)]
    public async Task<IActionResult> Split(
        [FromForm] IFormFile? file,
        [FromForm] string mode = "each",
        [FromForm] int chunkSize = 1,
        [FromForm] string? ranges = null,
        CancellationToken cancellationToken = default)
    {
        if (file is null)
        {
            return BadRequest(new { error = "Upload a PDF file to split." });
        }

        var validationError = ValidatePdf(file);
        if (validationError is not null)
        {
            return BadRequest(new { error = validationError });
        }

        var normalizedMode = (mode ?? "each").Trim().ToLowerInvariant();
        if (normalizedMode is not ("each" or "chunk" or "ranges"))
        {
            return BadRequest(new { error = "mode must be one of: each, chunk, ranges." });
        }

        if (normalizedMode == "chunk" && chunkSize < 1)
        {
            return BadRequest(new { error = "chunkSize must be at least 1." });
        }

        var jobPath = _tempFiles.CreateJobDirectory();

        try
        {
            var inputPath = Path.Combine(jobPath, SanitizeFileName(file.FileName));
            await using (var stream = System.IO.File.Create(inputPath))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            using var input = PdfReader.Open(inputPath, PdfDocumentOpenMode.Import);
            if (input.PageCount == 0)
            {
                return BadRequest(new { error = "PDF has no pages." });
            }

            List<List<int>> parts;
            try
            {
                parts = BuildSplitParts(normalizedMode, input.PageCount, chunkSize, ranges);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }

            if (parts.Count == 0)
            {
                return BadRequest(new { error = "No output parts produced from the split options." });
            }

            await using var zipMemory = new MemoryStream();
            using (var archive = new ZipArchive(zipMemory, ZipArchiveMode.Create, leaveOpen: true))
            {
                for (var partIndex = 0; partIndex < parts.Count; partIndex++)
                {
                    var pageIndexes = parts[partIndex];
                    using var partDoc = new PdfDocument();
                    foreach (var pageIndex in pageIndexes)
                    {
                        partDoc.AddPage(input.Pages[pageIndex]);
                    }

                    var entryName = parts.Count == 1
                        ? "part-1.pdf"
                        : $"part-{partIndex + 1:D3}.pdf";
                    var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
                    await using var entryStream = entry.Open();
                    partDoc.Save(entryStream, closeStream: false);
                }
            }

            var zipBytes = zipMemory.ToArray();
            _logger.LogInformation(
                "Split PDF into {PartCount} parts ({Bytes} bytes ZIP)",
                parts.Count,
                zipBytes.Length);

            Response.Headers["X-Part-Count"] = parts.Count.ToString();
            return File(zipBytes, "application/zip", "split.zip");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF split failed");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Failed to split PDF. Ensure the file is a valid, non-encrypted PDF."
            });
        }
        finally
        {
            _tempFiles.DeleteJobDirectory(jobPath);
        }
    }

    /// <summary>
    /// Extract selected pages into a single PDF. pages e.g. "1-3,5,8"
    /// </summary>
    [HttpPost("extract")]
    [RequestSizeLimit(MaxFileBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileBytes)]
    public async Task<IActionResult> Extract(
        [FromForm] IFormFile? file,
        [FromForm] string? pages,
        CancellationToken cancellationToken = default)
    {
        if (file is null)
        {
            return BadRequest(new { error = "Upload a PDF file to extract pages from." });
        }

        var validationError = ValidatePdf(file);
        if (validationError is not null)
        {
            return BadRequest(new { error = validationError });
        }

        var jobPath = _tempFiles.CreateJobDirectory();

        try
        {
            var inputPath = Path.Combine(jobPath, SanitizeFileName(file.FileName));
            await using (var stream = System.IO.File.Create(inputPath))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            using var input = PdfReader.Open(inputPath, PdfDocumentOpenMode.Import);
            if (input.PageCount == 0)
            {
                return BadRequest(new { error = "PDF has no pages." });
            }

            List<int> pageIndexes;
            try
            {
                var parts = ParseRanges(pages, input.PageCount);
                pageIndexes = parts.SelectMany(p => p).ToList();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }

            if (pageIndexes.Count == 0)
            {
                return BadRequest(new { error = "No pages selected." });
            }

            using var output = new PdfDocument();
            foreach (var pageIndex in pageIndexes)
            {
                output.AddPage(input.Pages[pageIndex]);
            }

            var pageCount = output.PageCount;
            await using var memory = new MemoryStream();
            output.Save(memory, false);
            var bytes = memory.ToArray();

            _logger.LogInformation(
                "Extracted {PageCount} pages ({Bytes} bytes)",
                pageCount,
                bytes.Length);

            return File(bytes, "application/pdf", "extracted.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF extract failed");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Failed to extract pages. Ensure the file is a valid, non-encrypted PDF."
            });
        }
        finally
        {
            _tempFiles.DeleteJobDirectory(jobPath);
        }
    }

    /// <summary>
    /// Returns zero-based page index groups for each output PDF.
    /// </summary>
    private static List<List<int>> BuildSplitParts(string mode, int pageCount, int chunkSize, string? ranges)
    {
        return mode switch
        {
            "each" => Enumerable.Range(0, pageCount).Select(i => new List<int> { i }).ToList(),
            "chunk" => ChunkPages(pageCount, chunkSize),
            "ranges" => ParseRanges(ranges, pageCount),
            _ => throw new ArgumentException("Invalid mode.")
        };
    }

    private static List<List<int>> ChunkPages(int pageCount, int chunkSize)
    {
        var parts = new List<List<int>>();
        for (var start = 0; start < pageCount; start += chunkSize)
        {
            var end = Math.Min(start + chunkSize, pageCount);
            parts.Add(Enumerable.Range(start, end - start).ToList());
        }

        return parts;
    }

    private static List<List<int>> ParseRanges(string? ranges, int pageCount)
    {
        if (string.IsNullOrWhiteSpace(ranges))
        {
            throw new ArgumentException("Provide ranges like 1-3,5,7-9.");
        }

        var parts = new List<List<int>>();
        var tokens = ranges.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var token in tokens)
        {
            var match = Regex.Match(token, @"^(\d+)(?:\s*-\s*(\d+))?$");
            if (!match.Success)
            {
                throw new ArgumentException($"Invalid range '{token}'. Use forms like 3 or 1-4.");
            }

            var start = int.Parse(match.Groups[1].Value);
            var end = match.Groups[2].Success ? int.Parse(match.Groups[2].Value) : start;

            if (start < 1 || end < 1 || start > pageCount || end > pageCount)
            {
                throw new ArgumentException(
                    $"Range '{token}' is out of bounds. PDF has {pageCount} page(s).");
            }

            if (end < start)
            {
                (start, end) = (end, start);
            }

            // Convert 1-based inclusive to zero-based indexes
            parts.Add(Enumerable.Range(start - 1, end - start + 1).ToList());
        }

        return parts;
    }

    private static string? ValidatePdf(IFormFile file)
    {
        if (file.Length <= 0)
        {
            return $"File '{file.FileName}' is empty.";
        }

        if (file.Length > MaxFileBytes)
        {
            return $"File '{file.FileName}' exceeds the 100 MB limit.";
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
        {
            return $"File '{file.FileName}' must be a .pdf.";
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !AllowedContentTypes.Contains(file.ContentType))
        {
            return $"File '{file.FileName}' has unsupported content type '{file.ContentType}'.";
        }

        return null;
    }

    private static string SanitizeFileName(string name)
    {
        var fileName = Path.GetFileName(name);
        foreach (var c in Path.GetInvalidFileNameChars())
        {
            fileName = fileName.Replace(c, '_');
        }

        return string.IsNullOrWhiteSpace(fileName) ? "upload.pdf" : fileName;
    }
}
