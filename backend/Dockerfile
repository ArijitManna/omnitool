# OmniFile API — ASP.NET Core + LibreOffice (high-fidelity Office → PDF)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/OmniFile.Api.csproj ./
RUN dotnet restore
COPY backend/ ./
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

USER root
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl \
        libreoffice-writer \
        libreoffice-calc \
        libreoffice-impress \
        libreoffice-java-common \
        default-jre-headless \
        fonts-dejavu-core \
        fonts-liberation \
        fonts-noto-core \
        fontconfig \
    && fc-cache -f \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN groupadd -r omnifile \
    && useradd -r -g omnifile -m -d /home/omnifile omnifile \
    && mkdir -p /app/App_Data/temp \
    && chown -R omnifile:omnifile /app /home/omnifile

COPY --from=build /app/publish .
COPY backend/appsettings.Docker.json ./appsettings.Production.json

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    HOME=/home/omnifile \
    LibreOffice__ExecutablePath=/usr/bin/soffice \
    LibreOffice__TimeoutSeconds=180

USER omnifile
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "OmniFile.Api.dll"]
