using Microsoft.AspNetCore.Http.Features;
using OmniFile.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<TempFileService>();
builder.Services.AddSingleton<LibreOfficeConversionService>();
builder.Services.AddHostedService<TempCleanupHostedService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (origin.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase)) return true;
                if (origin.StartsWith("http://127.0.0.1", StringComparison.OrdinalIgnoreCase)) return true;
                // Same-host reverse proxy / production UI
                return true;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("X-Part-Count"));
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100 * 1024 * 1024; // 100 MB
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.MapControllers();

app.MapGet("/api/health", (LibreOfficeConversionService lo) => Results.Ok(new
{
    status = "ok",
    service = "OmniFile.Api",
    libreOffice = lo.IsAvailable,
}));

app.Run();
