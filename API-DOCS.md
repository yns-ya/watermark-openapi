# Watermark API - Complete Documentation

**Version:** 1.0.0
**Base URL:** https://silly-seahorse-49d00d.netlify.app
**Endpoint:** `POST /.netlify/functions/watermark`

---

## 🎯 Overview

Stateless, ephemeral image watermarking API that processes images in-memory and returns results immediately. **No storage, no caching, no persistence.**

### Mental Model

```
Request → Validate → Process (RAM only) → Response → Forget Everything
```

---

## 🔐 Authentication

**Type:** JWT Bearer Token

**Header:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Requirements:**
- Must include `sub` (user ID) claim
- Must include `exp` (expiration) claim
- Must be signed with server's JWT_SECRET

**Error Response (401):**
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid or missing token"
}
```

---

## 📝 Request Specification

### HTTP Method & Endpoint

```
POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark
```

### Content-Type

```
multipart/form-data
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `image` | File | Source image (JPG/PNG/WebP, max 6MB) |
| `type` | string | `"text"` or `"image"` |
| `frequency` | string | JSON string defining placement (see below) |

### Type-Specific Required Fields

**When `type="text"`:**
- `text` (string, max 200 chars)
- `font` (string: `NotoSansThai`, `Roboto`, or `Inter`)

**When `type="image"`:**
- `wm_image` (File: watermark image)

---

## 📐 Frequency Parameter

The `frequency` parameter controls watermark placement and must be a **JSON string**.

### Mode: Single Position

Place watermark at a specific location.

```json
{
  "mode": "single",
  "position": "bottom_right",
  "margin_px": 24
}
```

**Positions:**
- `top_left`
- `top_right`
- `bottom_left`
- `bottom_right`
- `center`

**Parameters:**
- `margin_px` (optional): Distance from edge (0-500, default: 24)

### Mode: Grid

Place watermarks in a uniform grid pattern.

```json
{
  "mode": "grid",
  "spacing_px": 280
}
```

**Parameters:**
- `spacing_px` (optional): Distance between watermarks (20-2000, default: 280)

### Mode: Diagonal Tile

Place watermarks diagonally (most popular for copyright protection).

```json
{
  "mode": "diagonal_tile",
  "spacing_px": 280
}
```

**Parameters:**
- `spacing_px` (optional): Distance between watermarks (20-2000, default: 280)

---

## 🎨 Styling Parameters (Optional)

### Image Watermark Styling

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `wm_scale` | number | 0.01-5.0 | 0.2 | Size relative to shortest image side |
| `opacity` | number | 0-1 | 0.18 | Transparency (0=invisible, 1=opaque) |
| `angle_deg` | integer | -180 to 180 | -30 | Rotation angle in degrees |

### Text Watermark Styling

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `font_size` | integer | 8-512 | 32 | Font size in pixels |
| `font_weight` | integer | 100-900 | 400 | Font weight (100=thin, 900=black) |
| `color` | string | Hex color | #FFFFFF | Text color (e.g., #FF0000) |
| `opacity` | number | 0-1 | 0.18 | Transparency |
| `angle_deg` | integer | -180 to 180 | -30 | Rotation angle |

### Output Format

| Parameter | Type | Options | Default | Description |
|-----------|------|---------|---------|-------------|
| `output_format` | string | png, jpeg, webp | png | Output image format |
| `quality` | integer | 1-100 | 90 | Quality (JPEG/WebP only) |

---

## 📤 Response Specification

### Success (200 OK)

**Headers:**
```http
Content-Type: image/png (or image/jpeg, image/webp)
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
```

**Body:** Binary image data

### Error Responses

All errors return JSON:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Status | Code | Meaning | Resolution |
|--------|------|---------|------------|
| 400 | BAD_REQUEST | Invalid/missing parameters | Check required fields |
| 401 | UNAUTHORIZED | Invalid/missing JWT | Provide valid token |
| 413 | PAYLOAD_TOO_LARGE | Image exceeds 6MB | Reduce image size |
| 415 | UNSUPPORTED_MEDIA_TYPE | Invalid file type | Use JPG/PNG/WebP |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests | Wait and retry |
| 500 | INTERNAL_ERROR | Server processing error | Retry or contact support |

---

## 🚀 Quick Examples

### Example 1: Simple Text Watermark

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© Copyright 2025" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"single","position":"bottom_right"}' \
  --output watermarked.png
```

### Example 2: Diagonal Text Watermark (Thai)

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© ห้ามคัดลอก 2025" \
  -F "font=NotoSansThai" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":300}' \
  -F "opacity=0.2" \
  -F "font_size=36" \
  -F "color=#000000" \
  --output protected.png
```

### Example 3: Image Watermark

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=image" \
  -F "wm_image=@logo.png" \
  -F 'frequency={"mode":"diagonal_tile"}' \
  -F "wm_scale=0.15" \
  -F "opacity=0.3" \
  --output branded.png
```

### Example 4: Grid Pattern with Custom Styling

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@document.jpg" \
  -F "type=text" \
  -F "text=CONFIDENTIAL" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"grid","spacing_px":200}' \
  -F "opacity=0.25" \
  -F "font_size=48" \
  -F "font_weight=700" \
  -F "color=#FF0000" \
  -F "angle_deg=0" \
  --output confidential.png
```

### Example 5: WebP Output for Web

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© 2025" \
  -F "font=Inter" \
  -F 'frequency={"mode":"single","position":"center"}' \
  -F "output_format=webp" \
  -F "quality=80" \
  --output optimized.webp
```

---

## 💻 JavaScript/TypeScript Examples

### Vanilla JavaScript

```javascript
async function addWatermark(imageFile, options = {}) {
  const formData = new FormData();

  // Required fields
  formData.append('image', imageFile);
  formData.append('type', options.type || 'text');
  formData.append('frequency', JSON.stringify(
    options.frequency || { mode: 'diagonal_tile', spacing_px: 280 }
  ));

  // Type-specific fields
  if (options.type === 'text') {
    formData.append('text', options.text);
    formData.append('font', options.font || 'Roboto');
  } else if (options.type === 'image') {
    formData.append('wm_image', options.wm_image);
  }

  // Optional styling
  if (options.opacity) formData.append('opacity', options.opacity);
  if (options.output_format) formData.append('output_format', options.output_format);

  const response = await fetch(
    'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUR_JWT_TOKEN}`
      },
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.code}: ${error.message}`);
  }

  return await response.blob();
}

// Usage
const file = document.getElementById('file-input').files[0];
const blob = await addWatermark(file, {
  type: 'text',
  text: '© Copyright 2025',
  font: 'Roboto',
  opacity: 0.2
});

const url = URL.createObjectURL(blob);
document.getElementById('preview').src = url;
```

### React + TypeScript

```typescript
import { useState } from 'react';

interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  font?: 'NotoSansThai' | 'Roboto' | 'Inter';
  wm_image?: File;
  opacity?: number;
  frequency?: {
    mode: 'single' | 'grid' | 'diagonal_tile';
    position?: string;
    margin_px?: number;
    spacing_px?: number;
  };
  output_format?: 'png' | 'jpeg' | 'webp';
}

function useWatermark() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWatermark = async (
    imageFile: File,
    options: WatermarkOptions
  ): Promise<Blob> => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', options.type);
    formData.append('frequency', JSON.stringify(
      options.frequency || { mode: 'diagonal_tile' }
    ));

    if (options.type === 'text' && options.text && options.font) {
      formData.append('text', options.text);
      formData.append('font', options.font);
    } else if (options.type === 'image' && options.wm_image) {
      formData.append('wm_image', options.wm_image);
    }

    if (options.opacity) {
      formData.append('opacity', options.opacity.toString());
    }

    try {
      const response = await fetch(
        'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_JWT_TOKEN}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      return await response.blob();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addWatermark, loading, error };
}

// Usage in component
function WatermarkForm() {
  const { addWatermark, loading, error } = useWatermark();
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (file: File) => {
    const blob = await addWatermark(file, {
      type: 'text',
      text: '© Copyright 2025',
      font: 'Roboto',
      opacity: 0.2,
      frequency: { mode: 'diagonal_tile', spacing_px: 280 }
    });

    const url = URL.createObjectURL(blob);
    setResult(url);
  };

  return (
    <div>
      {loading && <p>Processing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <img src={result} alt="Watermarked" />}
    </div>
  );
}
```

### Python Example

```python
import requests

def add_watermark(
    image_path: str,
    token: str,
    watermark_text: str,
    font: str = 'Roboto'
) -> bytes:
    """
    Add text watermark to an image.

    Args:
        image_path: Path to source image
        token: JWT bearer token
        watermark_text: Text to use as watermark
        font: Font name (NotoSansThai, Roboto, or Inter)

    Returns:
        Binary image data
    """
    url = 'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark'

    files = {
        'image': open(image_path, 'rb')
    }

    data = {
        'type': 'text',
        'text': watermark_text,
        'font': font,
        'frequency': '{"mode":"diagonal_tile","spacing_px":280}',
        'opacity': '0.2',
        'output_format': 'png'
    }

    headers = {
        'Authorization': f'Bearer {token}'
    }

    response = requests.post(url, files=files, data=data, headers=headers)

    if response.status_code != 200:
        error = response.json()
        raise Exception(f"{error['code']}: {error['message']}")

    return response.content

# Usage
watermarked = add_watermark('photo.jpg', 'YOUR_TOKEN', '© Copyright 2025')

with open('watermarked.png', 'wb') as f:
    f.write(watermarked)
```

---

## ⚙️ Platform Limits

### Netlify Free Tier

| Limit | Value |
|-------|-------|
| Max execution time | 10 seconds |
| Max payload size | 6 MB |
| Max memory | 1024 MB |
| Monthly invocations | 125,000 |
| Monthly runtime | 100 hours |

### Application Limits

| Limit | Value | Enforced By |
|-------|-------|-------------|
| Max file size | 6 MB | 413 error |
| Max image dimensions | 4096 x 4096 px | 413 error |
| Max text length | 200 characters | 400 error |
| Max font size | 512 px | 400 error |
| Max spacing | 2000 px | 400 error |

---

## 🔤 Available Fonts

| Font Name | Languages | Use Case |
|-----------|-----------|----------|
| `NotoSansThai` | Thai + English | Thai text watermarks |
| `Roboto` | English | Modern, clean English text |
| `Inter` | English | Web-optimized English text |

**Important:** Always use `NotoSansThai` for Thai text.

---

## 🛡️ Security & Privacy

### Privacy Guarantees

✅ **What We DO:**
- Process images in RAM only
- Return result immediately
- Forget everything after response

❌ **What We DO NOT Do:**
- Store images
- Cache images
- Create permanent URLs
- Log image data
- Track user content

### Security Features

- JWT authentication required
- Input validation on all parameters
- File type validation (MIME checking)
- Size limit enforcement
- Rate limiting
- No stack traces exposed
- CORS configured

---

## 🐛 Troubleshooting

### Common Errors

**"Invalid or missing token"**
```
Cause: Missing Authorization header or invalid JWT
Fix: Include valid Bearer token in Authorization header
```

**"wm_image is required when type=image"**
```
Cause: type=image but wm_image file not provided
Fix: Include wm_image file in form-data
```

**"Image is too large"**
```
Cause: File size exceeds 6MB
Fix: Compress or resize image before upload
```

**"Invalid file type"**
```
Cause: File is not JPG, PNG, or WebP
Fix: Convert image to supported format
```

**"Invalid frequency JSON"**
```
Cause: frequency parameter is not valid JSON string
Fix: Use JSON.stringify() to convert object to string
```

### Validation Checklist

Before sending request, verify:

- [ ] File size ≤ 6MB
- [ ] File type is JPG/PNG/WebP
- [ ] Authorization header includes Bearer token
- [ ] `type` is "text" or "image"
- [ ] `frequency` is JSON string (not object)
- [ ] If type=text: `text` and `font` provided
- [ ] If type=image: `wm_image` file provided
- [ ] All numeric values are within valid ranges

---

## 📊 Rate Limiting

**Limit:** ~30 requests per minute per IP

**429 Response:**
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests"
}
```

**Handling:**
```javascript
async function addWatermarkWithRetry(file, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await addWatermark(file);
    } catch (error) {
      if (error.message.includes('429') && i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

---

## 📚 Additional Resources

- **[README.md](./README.md)** - Project overview and quick start
- **[API-GUIDE.md](./API-GUIDE.md)** - Detailed usage examples
- **[FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md)** - Frontend integration guide
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Backend implementation guide
- **[SECURITY.md](./SECURITY.md)** - Security and privacy details
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Netlify deployment guide
- **[CHECKLIST.md](./CHECKLIST.md)** - Pre-production checklist
- **[OpenAPI Spec](./%20.yaml)** - Complete API specification

---

## 🆘 Support

**Issues:** Report bugs or request features
**Documentation:** See files above for detailed guides
**API Status:** Check Netlify dashboard for uptime

---

**API Endpoint:** https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark
**Authentication:** JWT Bearer Token
**Architecture:** Stateless, Ephemeral, Zero-Storage
**Platform:** Netlify Functions (Free Tier Compatible)
**Version:** 1.0.0
