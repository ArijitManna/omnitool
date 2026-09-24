namespace OmniFile.Api.Services;

public sealed class TempCleanupHostedService : BackgroundService
{
    private readonly TempFileService _tempFiles;
    private readonly ILogger<TempCleanupHostedService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(1);

    public TempCleanupHostedService(TempFileService tempFiles, ILogger<TempCleanupHostedService> logger)
    {
        _tempFiles = tempFiles;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var removed = _tempFiles.CleanupOlderThan(MaxAge);
                if (removed > 0)
                {
                    _logger.LogInformation("Removed {Count} orphan temp job directories", removed);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Temp cleanup sweep failed");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
