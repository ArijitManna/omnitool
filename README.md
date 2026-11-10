# SwiftDoc

One platform for everyday file, image, PDF, and document utilities.

Live tools (Phase 0 + batch 2):

| Tool | Processing | Notes |
| --- | --- | --- |
| **Image Compressor** | Browser | Quality slider, JPG/PNG/WebP |
| **Reduce Image to Target KB** | Browser | Binary-search quality (+ scale) to hit target size |
| **Image Resizer** | Browser | Pixels or %, lock aspect ratio |
| **JPG / PNG / WebP Converter** | Browser | Format conversion in-browser |
| **QR Code Generator** | Browser | Text/URL → PNG download |
| **JSON Beautifier** | Browser | Pretty-print / minify, validate, copy & download |
| **PDF Merge** | ASP.NET API | Multipart upload → merged.pdf; temps deleted |
| **Image to PDF** | Browser | Multi-image → PDF (A4 / Letter / fit) |
| **Passport Photo Generator** | Browser | India/US/UK sizes, crop or pad, bg color |
| **Signature Resizer** | Browser | Max dimensions + optional target KB |
| **HEIC → JPG** | Browser | iPhone HEIC/HEIF → JPEG |
| **PDF to JPG** | Browser | Pages → JPG ZIP (pdf.js) |
| **PDF Compressor** | Browser | Lossy rasterize → smaller PDF |
| **PDF Target Size** | Browser | Aim for ~target KB (lossy) |
| **PDF to Word** | Browser | Text extract → DOCX |
| **OCR (Image/PDF)** | Browser | Tesseract English → .txt |
| **Word to PDF** | LibreOffice API (browser fallback) | High-fidelity when LO available |
| **Excel to PDF** | LibreOffice API (browser fallback) | High-fidelity when LO available |
| **PowerPoint to PDF** | LibreOffice API (browser fallback) | High-fidelity when LO available |

Full requirements: [docs/BRD.md](docs/BRD.md)

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS 4
- **Backend:** ASP.NET Core Web API (.NET 10) + PDFsharp
- **Storage:** Local temp under `backend/App_Data/temp` (auto-cleaned)

## Prerequisites

- Node.js 20+
- .NET 10 SDK

## Run locally

### 1. API

```bash
cd backend
dotnet run --launch-profile http
```

API listens on `http://localhost:5265`  
Swagger (dev): `http://localhost:5265/swagger`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`  
Vite proxies `/api/*` → `http://localhost:5265`.

## Deploy with Docker

One stack: **nginx (frontend)** + **ASP.NET API with LibreOffice**.

```bash
# from repo root
docker compose up -d --build
```

Open **http://localhost/** (port 80).  
Nginx serves the UI and proxies `/api/*` to the API container.

Useful commands:

```bash
docker compose ps
docker compose logs -f api
curl http://localhost/api/health
curl http://localhost/api/docs/engine
docker compose down
```

Images:

| Service | Dockerfile | Role |
| --- | --- | --- |
| `api` | [backend/Dockerfile](backend/Dockerfile) | .NET 10 API + LibreOffice Writer/Calc/Impress + fonts |
| `web` | [frontend/Dockerfile](frontend/Dockerfile) | Vite production build + nginx |

Temp uploads/conversions persist in the `api_data` volume (`/app/App_Data`).

To publish on another host port (e.g. 8088):

```yaml
# docker-compose.yml → web.ports
- "8088:80"
```

## LibreOffice (high-fidelity Office → PDF)

Word / Excel / PowerPoint conversions prefer the API when LibreOffice is installed:

1. Install [LibreOffice](https://www.libreoffice.org/download/)
2. Restart the API (`dotnet run` in `backend/`)
3. Check `GET /api/docs/engine` or `/api/health` — `libreOffice: true`

Optional override in `backend/appsettings.json`:

```json
"LibreOffice": {
  "ExecutablePath": "C:\\\\Program Files\\\\LibreOffice\\\\program\\\\soffice.exe",
  "TimeoutSeconds": 120
}
```

Or set env `LIBREOFFICE_PATH`. If LibreOffice is missing, the UI falls back to browser conversion automatically.

- `POST /api/docs/to-pdf` — multipart `file` → PDF
- Supports `.doc/.docx`, `.xls/.xlsx`, `.ppt/.pptx`, and ODF equivalents


```
Upload → Options → Process → Preview → Download
```

- Image & QR: processed in the browser.
- PDF merge: `POST /api/pdf/merge` (`files`) → `merged.pdf`.
- PDF split: `POST /api/pdf/split` (`file`, `mode=each|chunk|ranges`, optional `chunkSize` / `ranges`) → ZIP.
- PDF extract: `POST /api/pdf/extract` (`file`, `pages`) → single PDF.
- Temp job folders under `App_Data/temp` are deleted after each response; a sweeper removes orphans older than 1 hour.

## Live vs planned tools

The home grid lists Phase-1 MVP tools from the BRD. Cards marked **Live** are implemented; others open a “Coming soon” panel.

## Security notes (Phase 0)

- Max upload ~100 MB
- PDF extension + content-type checks
- No public URLs for temp files
- No auth / database yet (anonymous use)
