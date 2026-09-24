# Business Requirement Document (BRD)

## Utility Web Application – File & Document Tools

### 1. Project Overview

The proposed application will be a web-based Utility Platform that provides commonly required tools for processing images, PDFs, documents, QR codes, and other files.

The objective is to provide users with a simple, fast, and easy-to-use platform where they can perform common file conversion, compression, resizing, merging, splitting, and document-processing activities without installing desktop software.

### 2. Business Objective

The application aims to:

- Provide commonly used file and document utilities from a single platform.
- Reduce image and PDF file sizes for online submissions.
- Convert files between commonly used formats.
- Provide bulk file-processing capabilities.
- Simplify preparation of photos, signatures, and documents for applications.
- Provide basic PDF manipulation features.
- Provide QR and barcode generation utilities.
- Minimize the need for users to install additional software.

### 3. Target Users

- General internet users
- Students
- Job applicants
- Office employees
- Business users
- Developers
- Freelancers
- Users preparing government/college/job applications
- Users working with documents and images regularly

### 4. Major Modules

#### A. Image Utilities

| Feature | Description |
| --- | --- |
| Image Compressor | Reduce image file size |
| Reduce Image to Target Size | Compress image to specified KB |
| Image Resizer | Resize image by pixels/percentage |
| Bulk Image Compressor | Compress multiple images |
| Bulk Image Converter | Convert multiple images |
| JPG ↔ PNG | Convert image formats |
| JPG/PNG ↔ WebP | Web image conversion |
| HEIC → JPG | Convert iPhone images |
| Image → PDF | Convert one/multiple images to PDF |
| Image Cropper | Crop images |
| Passport Photo Generator | Create standard-size photos |
| Signature Resizer | Resize signature |
| Background Remover | Remove image background |
| Metadata Remover | Remove EXIF metadata |
| Image Watermark | Add text/image watermark |

#### B. PDF Utilities

| Feature | Description |
| --- | --- |
| PDF Compressor | Reduce PDF size |
| PDF Target Size | Compress PDF to target size |
| PDF Merge | Combine multiple PDFs |
| PDF Split | Split PDF into multiple files |
| PDF Page Extractor | Extract selected pages |
| PDF Page Delete | Delete selected pages |
| PDF Page Reorder | Rearrange pages |
| PDF → JPG | Convert PDF pages to images |
| PDF → Word | Convert PDF to DOCX |
| PDF → Excel | Extract PDF data to Excel |
| PDF → Text | Extract text |
| PDF OCR | Convert scanned PDF to searchable PDF |
| PDF Password Protect | Add password |
| PDF Rotate | Rotate pages |
| PDF Watermark | Add watermark |
| PDF Page Numbering | Add page numbers |

#### C. Document Utilities

- Word → PDF
- Excel → PDF
- PowerPoint → PDF
- Text → PDF
- HTML → PDF
- Markdown → PDF
- Image OCR
- Document Scanner

#### D. Application/Submission Utilities

These tools will help users prepare documents according to common upload requirements.

- Photo to required KB
- Signature to required KB
- Passport-size photo
- Signature resizing
- Photo background whitening
- Image to required dimensions
- Multiple images → single PDF
- Document scanning and cleanup

#### E. QR & Barcode Utilities

- QR Code Generator
- UPI QR Generator
- Wi-Fi QR Generator
- Contact QR Generator
- QR Code Scanner/Decoder
- Barcode Generator

#### F. File Utilities

- File Size Converter
- Base64 Encoder
- Base64 Decoder
- ZIP Creator
- ZIP Extractor
- File Type/MIME Checker

### 5. Key Functional Requirements

#### FR-01: File Upload

Users should be able to upload files using:

- File selection
- Drag and drop
- Multiple file selection where applicable

#### FR-02: File Processing

The system should process uploaded files according to the selected utility.

Example:

```
Upload Image
      ↓
Select Target Size
      ↓
Process
      ↓
Preview Result
      ↓
Download
```

#### FR-03: Target File Size

Users should be able to specify a target size.

Example:

- Original: 2.5 MB
- Target: 50 KB / 100 KB / 200 KB / Custom: 150 KB
- Result: ~145 KB

#### FR-04: Bulk Processing

Selected utilities should support multiple files.

Example:

```
20 JPG Images
       ↓
Convert to WEBP
       ↓
Download ZIP
```

#### FR-05: Preview

Where applicable, users should be able to preview:

- Original file
- Processed file
- File size
- Compression percentage
- PDF pages

#### FR-06: Download

Users should be able to download:

- Individual processed files
- Multiple files as ZIP

### 6. Non-Functional Requirements

#### Performance

- File processing should be optimized for fast response.
- Large files should be processed asynchronously where required.
- Bulk processing should not block the web application.

#### Security

- Uploaded files should be securely processed.
- Files should not be publicly accessible.
- Temporary files should be automatically deleted after a defined period.
- File type and size validation should be implemented.
- Malicious file uploads should be restricted.

#### Usability

- Responsive UI
- Mobile-friendly design
- Simple drag-and-drop interface
- Minimal steps to complete an operation
- Clear download buttons
- Progress indicator for long-running operations

### 7. Proposed Technology

#### Frontend

- React
- Material UI / Bootstrap _(Phase-0 uses Tailwind, ported from the OmniFile HTML prototype)_
- JavaScript / TypeScript

#### Backend

- ASP.NET Core Web API
- .NET 10

#### File Processing

Depending on functionality:

- ImageSharp / SkiaSharp
- PDF processing library
- LibreOffice / document conversion engine
- OCR engine
- ZXing / QR processing

#### Storage

Initially:

- Temporary Local Storage

Future:

- Azure Blob Storage / AWS S3

#### Database

Database may initially be optional.

If required:

- SQL Server

It can store:

- User information
- Processing history
- Tool usage
- Subscription information
- System configuration

### 8. MVP Scope

The first release should focus on the most commonly required tools.

#### Phase 1 – MVP

**Image**

- Image Compressor
- Reduce Image to Target KB
- Image Resizer
- JPG ↔ PNG
- JPG/PNG ↔ WebP
- Image → PDF
- HEIC → JPG

**PDF**

- PDF Compressor
- PDF Target Size
- PDF Merge
- PDF Split
- PDF Page Extractor
- PDF → JPG
- PDF → Word
- PDF OCR

**Documents**

- Word → PDF
- Excel → PDF
- PowerPoint → PDF

**Application Tools**

- Passport Photo Generator
- Signature Resizer
- Document Scanner

**Other**

- QR Code Generator

### 9. Future Enhancements

The platform can later introduce:

- User accounts
- Processing history
- Cloud storage integration
- API access
- Bulk processing plans
- Subscription plans
- Premium conversion tools
- Developer utilities
- Calculator utilities
- Advanced OCR
- AI-powered document/image processing

### 10. Success Criteria

The MVP will be considered successful when users can:

- Upload a supported file.
- Select the required utility.
- Process the file successfully.
- Preview the result where applicable.
- Download the processed file.
- Process multiple files for supported bulk operations.
- Complete common operations without registration.

### Proposed Product Concept

> "One platform for everyday file, image, PDF and document utilities."

The initial focus should be fast, simple, privacy-conscious, and mostly free-to-use utilities, with monetization added later for advanced/bulk processing.
