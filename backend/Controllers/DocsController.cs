using Microsoft.AspNetCore.Mvc;
using OmniFile.Api.Services;

namespace OmniFile.Api.Controllers;

[ApiController]
[Route("api/docs")]
public sealed class DocsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".doc", ".docx", ".odt",
        ".xls", ".xlsx", ".ods",
        ".ppt", ".pptx", ".odp",
    };

    private const long MaxFileBytes = 100 * 1024 * 1024;

    private readonly LibreOfficeConversionService _libreOffice;
    private readonly ILogger<DocsController> _logger;

    public DocsController(LibreOfficeConversionService libreOffice, ILogger<DocsController> logger)
    {
        _libreOffice = libreOffice;
        _logger = logger;
    }

    /// <summary>Reports whether high-fidelity LibreOffice conversion is available.</summary>
    [HttpGet("engine")]
    public IActionResult Engine()
    {
        return Ok(new
        {
            libreOffice = _libreOffice.IsAvailable,
            executablePath = _libreOffice.IsAvailable ? _libreOffice.ExecutablePath : null,
            message = _libreOffice.IsAvailable
                ? "High-fidelity Office → PDF via LibreOffice is available."
                : "LibreOffice not found. Install LibreOffice or set LibreOffice:ExecutablePath. Client-side fallback remains available in the UI.",
        });
    }

    /// <summary>Convert Word / Excel / PowerPoint (and ODF) to PDF using LibreOffice.</summary>
    [HttpPost("to-pdf")]
    [RequestSizeLimit(MaxFileBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileBytes)]
    public async Task<IActionResult> ToPdf([FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        if (!_libreOffice.IsAvailable)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                error = "LibreOffice is not available on this server.",
                code = "LIBREOFFICE_UNAVAILABLE",
            });
        }

        if (file is null || file.Length <= 0)
        {
            return BadRequest(new { error = "Upload an Office document." });
        }

        if (file.Length > MaxFileBytes)
        {
            return BadRequest(new { error = "File exceeds the 100 MB limit." });
        }

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
        {
            return BadRequest(new
            {
                error = $"Unsupported type '{ext}'. Use Word, Excel, PowerPoint, or OpenDocument files.",
            });
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var pdfBytes = await _libreOffice.ConvertToPdfAsync(stream, file.FileName, cancellationToken);
            var outName = Path.GetFileNameWithoutExtension(file.FileName) + ".pdf";
            _logger.LogInformation(
                "Converted {Name} ({BytesIn} bytes) → PDF ({BytesOut} bytes)",
                file.FileName,
                file.Length,
                pdfBytes.Length);
            return File(pdfBytes, "application/pdf", outName);
        }
        catch (TimeoutException ex)
        {
            _logger.LogWarning(ex, "LibreOffice timeout for {Name}", file.FileName);
            return StatusCode(StatusCodes.Status504GatewayTimeout, new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "LibreOffice conversion failed for {Name}", file.FileName);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected conversion failure for {Name}", file.FileName);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Document conversion failed.",
            });
        }
    }
}
