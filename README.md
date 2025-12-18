# Watermark API

Serverless image watermarking API built for Netlify Functions. Add text or image watermarks to images with various placement modes, no storage required.

## Features

- **Image & Text Watermarks**: Support for both image overlays and custom text
- **Multiple Placement Modes**: Single position, grid, or diagonal tile patterns
- **Zero Storage**: Processes images in-memory and returns immediately
- **Flexible Styling**: Control opacity, rotation, size, color, and fonts
- **Format Support**: Input/output in PNG, JPEG, or WebP
- **JWT Authentication**: Bearer token security
- **Thai Language Support**: Includes Thai fonts for text watermarks

## Quick Start

### Endpoint

```
POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark
```

### Authentication

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Basic Example (Text Watermark)

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© Copyright 2025" \
  -F "font=NotoSansThai" \
  -F "frequency={\"mode\":\"diagonal_tile\"}" \
  --output watermarked.png
```

### Basic Example (Image Watermark)

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=image" \
  -F "wm_image=@logo.png" \
  -F "frequency={\"mode\":\"diagonal_tile\"}" \
  --output watermarked.png
```

## Request Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `image` | binary | Source image file (JPG/PNG/WebP) |
| `type` | string | Watermark type: `image` or `text` |
| `frequency` | object | Placement configuration (JSON) |

### Image Watermark Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `wm_image` | binary | - | Watermark image file (required when type=image) |
| `wm_scale` | number | 0.2 | Watermark size relative to shortest side (0.01-5) |

### Text Watermark Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | - | Watermark text (required when type=text, max 200 chars) |
| `font` | string | - | Font name (required when type=text) |
| `font_weight` | integer | 400 | Font weight (100-900) |
| `font_size` | integer | 32 | Font size in pixels (8-512) |
| `color` | string | #FFFFFF | Text color in HEX format |

### Common Styling Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `opacity` | number | 0.18 | Watermark opacity (0-1) |
| `angle_deg` | integer | -30 | Rotation angle in degrees (-180 to 180) |
| `output_format` | string | png | Output format: `png`, `jpeg`, or `webp` |
| `quality` | integer | 90 | Quality for JPEG/WebP (1-100) |

### Frequency Object

The `frequency` parameter controls watermark placement:

```json
{
  "mode": "diagonal_tile",
  "spacing_px": 280
}
```

**Modes:**
- `single`: Place watermark at one position
- `grid`: Place watermarks in a grid pattern
- `diagonal_tile`: Place watermarks diagonally (most popular)

**Single Mode Properties:**
```json
{
  "mode": "single",
  "position": "bottom_right",
  "margin_px": 24
}
```

- `position`: `top_left`, `top_right`, `bottom_left`, `bottom_right`, `center`
- `margin_px`: Distance from edge (0-500)

**Grid/Diagonal Tile Properties:**
```json
{
  "mode": "grid",
  "spacing_px": 280
}
```

- `spacing_px`: Distance between watermarks (20-2000)

## Response Formats

### Success (200 OK)

Returns the watermarked image as binary data.

**Headers:**
- `Content-Type`: `image/png`, `image/jpeg`, or `image/webp`
- `Cache-Control`: `no-store`

### Error Responses

**400 Bad Request**
```json
{
  "code": "BAD_REQUEST",
  "message": "wm_image is required when type=image"
}
```

**413 Payload Too Large**
```json
{
  "code": "PAYLOAD_TOO_LARGE",
  "message": "Image is too large. Please upload a smaller file."
}
```

**415 Unsupported Media Type**
```json
{
  "code": "UNSUPPORTED_MEDIA_TYPE",
  "message": "File type not allowed"
}
```

**429 Too Many Requests**
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests"
}
```

**500 Internal Server Error**
```json
{
  "code": "INTERNAL_ERROR",
  "message": "Unexpected processing error"
}
```

## Platform Limits

Netlify Functions (Free Tier):
- **Max execution time**: 10 seconds
- **Max payload size**: 6 MB
- **Memory**: 1024 MB
- **Recommended max image**: 4000x4000 pixels

## Supported Fonts

The following fonts are bundled with the API:

- `NotoSansThai` (Thai + Latin)
- `Roboto` (Latin)
- `Inter` (Latin)

## Security

- JWT bearer token authentication required
- Input validation for all parameters
- File type validation (MIME type checking)
- Size limit enforcement
- No file persistence (ephemeral processing only)

## ⚠️ Implementation Status

**Current Status:** Stub implementation deployed. See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md) for implementation checklist.

The infrastructure is ready, but the actual watermark processing code needs to be implemented following [IMPLEMENTATION.md](./IMPLEMENTATION.md).

## Documentation

- [Implementation Status](./IMPLEMENTATION-STATUS.md) - Current status and TODO list
- [Detailed API Guide](./API-GUIDE.md) - Usage examples and best practices
- [Implementation Guide](./IMPLEMENTATION.md) - Setup and deployment
- [OpenAPI Specification](./%20.yaml) - Complete API schema

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Image Processing**: Sharp (high-performance)
- **Validation**: Zod (type-safe validation)
- **Auth**: JWT (jsonwebtoken)
- **Platform**: Netlify Functions

---

**Version**: 1.0.0
**Platform**: Netlify Functions
**License**: MIT
