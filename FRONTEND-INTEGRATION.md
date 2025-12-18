# Frontend Integration Guide

## API Base URL

```
https://silly-seahorse-49d00d.netlify.app
```

## Endpoint

```
POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark
```

## Mental Model

This API is a **Stateless Image Transformer**:
- ✅ You send an image, you get back a watermarked image
- ❌ NO storage, NO permanent URLs, NO caching
- ⚡ Synchronous: Response contains the processed image immediately
- 🔒 Ephemeral: Image is forgotten after response

## Authentication

All requests require a JWT bearer token in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

Contact your backend team to obtain a valid JWT token.

## Request Format

### Content-Type

```
Content-Type: multipart/form-data
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `image` | File | Source image (JPG/PNG/WebP, max 6MB) |
| `type` | string | `"image"` or `"text"` |
| `frequency` | string | JSON string (see below) |

### Frequency Field Format

The `frequency` field must be a **JSON string** (not an object):

```javascript
// CORRECT ✅
formData.append('frequency', JSON.stringify({
  mode: 'diagonal_tile',
  spacing_px: 280
}));

// WRONG ❌
formData.append('frequency', { mode: 'diagonal_tile' });
```

### Frequency Modes

**1. Single Position (corner/center):**
```json
{
  "mode": "single",
  "position": "bottom_right",
  "margin_px": 24
}
```

**2. Grid Pattern:**
```json
{
  "mode": "grid",
  "spacing_px": 280
}
```

**3. Diagonal Tile (most popular):**
```json
{
  "mode": "diagonal_tile",
  "spacing_px": 280
}
```

### Text Watermark Fields

When `type="text"`:

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `text` | ✅ Yes | - | Watermark text (max 200 chars) |
| `font` | ✅ Yes | - | Font name (`NotoSansThai`, `Roboto`, `Inter`) |
| `font_size` | No | 32 | Font size in px (8-512) |
| `font_weight` | No | 400 | Font weight (100-900) |
| `color` | No | #FFFFFF | Hex color code |
| `opacity` | No | 0.18 | Opacity (0-1) |
| `angle_deg` | No | -30 | Rotation angle (-180 to 180) |

### Image Watermark Fields

When `type="image"`:

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `wm_image` | ✅ Yes | - | Watermark image file |
| `wm_scale` | No | 0.2 | Size relative to image (0.01-5) |
| `opacity` | No | 0.18 | Opacity (0-1) |
| `angle_deg` | No | -30 | Rotation angle (-180 to 180) |

### Output Fields (Optional)

| Field | Default | Description |
|-------|---------|-------------|
| `output_format` | png | Output format: `png`, `jpeg`, or `webp` |
| `quality` | 90 | Quality for JPEG/WebP (1-100) |

## Response Format

### Success Response (200 OK)

**Headers:**
```
Content-Type: image/png (or image/jpeg, image/webp)
Cache-Control: no-store, no-cache, must-revalidate
```

**Body:** Binary image data

### Error Responses

All errors return JSON:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid input (missing/invalid fields) |
| 401 | UNAUTHORIZED | Invalid or missing JWT token |
| 413 | PAYLOAD_TOO_LARGE | Image exceeds 6MB |
| 415 | UNSUPPORTED_MEDIA_TYPE | Invalid file type |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server processing error |

## JavaScript/TypeScript Examples

### Example 1: Basic Text Watermark (Vanilla JS)

```javascript
async function addWatermark(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('type', 'text');
  formData.append('text', '© Copyright 2025');
  formData.append('font', 'Roboto');
  formData.append('frequency', JSON.stringify({
    mode: 'diagonal_tile',
    spacing_px: 280
  }));

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
    throw new Error(error.message);
  }

  // Response is binary image
  const blob = await response.blob();
  return blob;
}

// Usage
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];

try {
  const watermarkedBlob = await addWatermark(file);

  // Display in browser
  const url = URL.createObjectURL(watermarkedBlob);
  document.getElementById('preview').src = url;

  // Or download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'watermarked.png';
  a.click();
} catch (error) {
  console.error('Watermark failed:', error.message);
}
```

### Example 2: Image Watermark (React)

```typescript
import { useState } from 'react';

interface WatermarkOptions {
  type: 'image' | 'text';
  frequency: {
    mode: 'single' | 'grid' | 'diagonal_tile';
    position?: string;
    margin_px?: number;
    spacing_px?: number;
  };
  text?: string;
  font?: string;
  opacity?: number;
  output_format?: 'png' | 'jpeg' | 'webp';
}

function WatermarkComponent() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addWatermark = async (
    imageFile: File,
    watermarkFile: File,
    options: Partial<WatermarkOptions> = {}
  ) => {
    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', 'image');
    formData.append('wm_image', watermarkFile);
    formData.append('frequency', JSON.stringify(
      options.frequency || { mode: 'diagonal_tile', spacing_px: 280 }
    ));

    if (options.opacity !== undefined) {
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

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {processing && <p>Processing...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {result && <img src={result} alt="Watermarked" />}
    </div>
  );
}
```

### Example 3: Thai Text Watermark

```javascript
async function addThaiWatermark(imageFile, thaiText) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('type', 'text');
  formData.append('text', thaiText); // e.g., "© ห้ามคัดลอก 2025"
  formData.append('font', 'NotoSansThai'); // Required for Thai
  formData.append('font_size', '36');
  formData.append('color', '#000000');
  formData.append('opacity', '0.2');
  formData.append('frequency', JSON.stringify({
    mode: 'diagonal_tile',
    spacing_px: 300
  }));

  const response = await fetch(
    'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark',
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }
  );

  return await response.blob();
}
```

## Error Handling Best Practices

### 1. Handle All Error Cases

```javascript
async function safeWatermark(imageFile) {
  try {
    const response = await fetch(endpoint, { /* ... */ });

    // Check HTTP status
    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          throw new Error(`Invalid input: ${error.message}`);
        case 401:
          throw new Error('Authentication failed. Please log in again.');
        case 413:
          throw new Error('Image too large. Maximum size is 6MB.');
        case 415:
          throw new Error('Invalid file type. Use JPG, PNG, or WebP.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again.');
        default:
          throw new Error(error.message || 'Unknown error');
      }
    }

    return await response.blob();
  } catch (err) {
    // Network errors
    if (err instanceof TypeError) {
      throw new Error('Network error. Check your connection.');
    }
    throw err;
  }
}
```

### 2. Validate Input Before Sending

```javascript
function validateImage(file) {
  const maxSize = 6 * 1024 * 1024; // 6MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!file) {
    throw new Error('No file selected');
  }

  if (file.size > maxSize) {
    throw new Error('Image must be less than 6MB');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPG, PNG, or WebP');
  }

  return true;
}

// Use before API call
try {
  validateImage(selectedFile);
  const result = await addWatermark(selectedFile);
} catch (error) {
  showErrorToUser(error.message);
}
```

### 3. Show Loading State

```javascript
// React example
const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

const handleSubmit = async () => {
  setStatus('loading');
  try {
    const blob = await addWatermark(file);
    setResult(blob);
    setStatus('success');
  } catch (error) {
    setError(error.message);
    setStatus('error');
  }
};

return (
  <button onClick={handleSubmit} disabled={status === 'loading'}>
    {status === 'loading' ? 'Processing...' : 'Add Watermark'}
  </button>
);
```

## Important Constraints

### File Size Limits

```javascript
const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB

if (file.size > MAX_FILE_SIZE) {
  alert('File too large. Maximum size is 6MB.');
  return;
}
```

### Supported Formats

Only these image formats are accepted:
- `image/jpeg`
- `image/png`
- `image/webp`

### Text Length Limit

```javascript
const MAX_TEXT_LENGTH = 200;

if (watermarkText.length > MAX_TEXT_LENGTH) {
  alert('Watermark text too long. Maximum 200 characters.');
  return;
}
```

### Available Fonts

Only these fonts are available:
- `NotoSansThai` - For Thai and English text
- `Roboto` - For English text
- `Inter` - For English text

**Always use `NotoSansThai` for Thai text.**

## UX Recommendations

### 1. Show Preview

Allow users to preview the watermark settings before processing:

```javascript
// Presets for common use cases
const presets = {
  subtle: {
    opacity: 0.15,
    frequency: { mode: 'single', position: 'bottom_right' }
  },
  protection: {
    opacity: 0.25,
    frequency: { mode: 'diagonal_tile', spacing_px: 200 }
  },
  proof: {
    opacity: 0.4,
    frequency: { mode: 'single', position: 'center' }
  }
};
```

### 2. Processing Time

Expect 2-8 seconds processing time depending on image size.
Show a progress indicator:

```javascript
<div className="processing">
  <Spinner />
  <p>Processing watermark...</p>
  <p className="text-sm">This may take a few seconds</p>
</div>
```

### 3. Download Handling

```javascript
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Clean up
}

// Usage
const watermarkedBlob = await addWatermark(file);
downloadBlob(watermarkedBlob, 'watermarked.png');
```

### 4. Memory Management

Always revoke object URLs when done:

```javascript
useEffect(() => {
  // Create object URL
  if (blob) {
    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }
}, [blob]);
```

## Rate Limiting

The API may enforce rate limits (typically 30 requests/minute).

### Handle 429 Errors

```javascript
async function addWatermarkWithRetry(imageFile, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(endpoint, options);

      if (response.status === 429) {
        // Rate limited, wait and retry
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return await response.blob();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Testing

### Test with curl

```bash
curl -X POST \
  https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  -F "type=text" \
  -F "text=TEST" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"diagonal_tile"}' \
  --output result.png
```

### Test Error Cases

```bash
# Missing token (should return 401)
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -F "image=@test.jpg"

# Invalid file type (should return 415)
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@test.txt"
```

## Checklist for Frontend Integration

- [ ] JWT token is obtained and stored securely
- [ ] File input validates size (max 6MB) and type (JPG/PNG/WebP)
- [ ] FormData is constructed correctly
- [ ] `frequency` is sent as JSON string
- [ ] Authorization header includes Bearer token
- [ ] Loading state is shown during processing
- [ ] Binary response is handled correctly (blob)
- [ ] All error statuses are handled (400, 401, 413, 415, 429, 500)
- [ ] Object URLs are revoked after use
- [ ] Thai text uses NotoSansThai font
- [ ] Rate limiting is handled with retry logic

## Common Pitfalls

### ❌ WRONG: Sending frequency as object

```javascript
formData.append('frequency', { mode: 'grid' }); // ❌ Will fail
```

### ✅ CORRECT: Sending frequency as JSON string

```javascript
formData.append('frequency', JSON.stringify({ mode: 'grid' })); // ✅
```

---

### ❌ WRONG: Forgetting Authorization header

```javascript
fetch(url, { method: 'POST', body: formData }); // ❌ Will return 401
```

### ✅ CORRECT: Including Bearer token

```javascript
fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }, // ✅
  body: formData
});
```

---

### ❌ WRONG: Not handling blob response

```javascript
const result = await response.json(); // ❌ Response is binary, not JSON
```

### ✅ CORRECT: Converting to blob

```javascript
const blob = await response.blob(); // ✅
const url = URL.createObjectURL(blob);
```

---

### ❌ WRONG: Memory leak with object URLs

```javascript
const url = URL.createObjectURL(blob);
img.src = url;
// Never revoked ❌
```

### ✅ CORRECT: Cleanup object URLs

```javascript
const url = URL.createObjectURL(blob);
img.src = url;

// Later, when done:
URL.revokeObjectURL(url); // ✅
```

---

## Frontend AI Prompt

**Copy this prompt and give it to your frontend AI assistant (Cursor, Claude, GitHub Copilot, etc.):**

---

```
I need to integrate with a watermarking API. Build a complete integration following these exact requirements:

# API Configuration
Endpoint: POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark
Authentication: JWT Bearer token (stored in env variable)
Request Type: multipart/form-data
Response Type: Binary image data (blob)

# Form Data Structure
```javascript
const formData = new FormData();

// Required fields
formData.append('image', fileObject); // File from <input type="file">
formData.append('type', 'text'); // or 'image'

// ⚠️ CRITICAL: frequency MUST be JSON.stringify(), NOT a plain object
formData.append('frequency', JSON.stringify({
  mode: 'diagonal_tile',  // or 'single', 'grid'
  spacing_px: 280
}));

// For text watermark (when type='text')
formData.append('text', '© Copyright 2025');
formData.append('font', 'NotoSansThai'); // or 'Roboto', 'Inter'
formData.append('font_size', '32');
formData.append('color', '#FFFFFF');

// For image watermark (when type='image')
formData.append('wm_image', watermarkFileObject);
formData.append('wm_scale', '0.2');

// Optional styling (both types)
formData.append('opacity', '0.2');
formData.append('angle_deg', '-30');
formData.append('output_format', 'png'); // or 'jpeg', 'webp'
formData.append('quality', '90'); // for jpeg/webp
```

# Request Implementation
```javascript
const response = await fetch(
  'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_JWT_TOKEN}`
    },
    body: formData // Don't set Content-Type, browser handles it
  }
);
```

# Response Handling
```javascript
// ⚠️ Success response is BINARY (blob), NOT JSON
if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Display image
  imageElement.src = url;

  // Or download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'watermarked.png';
  a.click();

  // ⚠️ CRITICAL: Always cleanup to prevent memory leaks
  URL.revokeObjectURL(url);
}

// Errors return JSON
if (!response.ok) {
  const error = await response.json();

  switch (response.status) {
    case 400: // Bad request
      alert(`Invalid input: ${error.message}`);
      break;
    case 401: // Unauthorized
      alert('Authentication failed');
      // Redirect to login
      break;
    case 413: // File too large
      alert('Image must be less than 6MB');
      break;
    case 415: // Unsupported file type
      alert('Use JPG, PNG, or WebP only');
      break;
    case 429: // Rate limit
      alert('Too many requests. Please wait.');
      // Implement retry with exponential backoff
      break;
    case 500: // Server error
      alert('Processing failed. Please try again.');
      break;
  }
}
```

# Critical Validation Rules (MUST IMPLEMENT)

## Before Upload:
1. File size: MAX 6MB
   ```javascript
   if (file.size > 6 * 1024 * 1024) {
     throw new Error('Image must be less than 6MB');
   }
   ```

2. File type: JPG, PNG, WebP only
   ```javascript
   const allowed = ['image/jpeg', 'image/png', 'image/webp'];
   if (!allowed.includes(file.type)) {
     throw new Error('Invalid file type');
   }
   ```

3. Text length: MAX 200 characters
   ```javascript
   if (text.length > 200) {
     throw new Error('Text too long (max 200 chars)');
   }
   ```

4. Thai text: MUST use 'NotoSansThai' font
   ```javascript
   if (text.includes('ก-๙')) { // Thai characters
     font = 'NotoSansThai';
   }
   ```

# Common Mistakes to AVOID

❌ WRONG: formData.append('frequency', { mode: 'grid' })
✅ RIGHT: formData.append('frequency', JSON.stringify({ mode: 'grid' }))

❌ WRONG: const data = await response.json()
✅ RIGHT: const blob = await response.blob()

❌ WRONG: No Authorization header
✅ RIGHT: headers: { 'Authorization': `Bearer ${token}` }

❌ WRONG: Never calling URL.revokeObjectURL()
✅ RIGHT: Always revoke when done: URL.revokeObjectURL(url)

❌ WRONG: Thai text with 'Roboto' font
✅ RIGHT: Thai text with 'NotoSansThai' font

# UX Requirements

1. Show file size/type validation BEFORE upload
2. Display loading indicator (processing takes 2-8 seconds)
3. Show character counter for text watermarks (max 200)
4. Implement rate limit handling (429 error → retry with backoff)
5. Always cleanup object URLs to prevent memory leaks
6. Display helpful error messages for all error codes

# React Hook Example Pattern

Please create a custom hook like this:

```typescript
import { useState } from 'react';

function useWatermark() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWatermark = async (file: File, options: WatermarkOptions) => {
    // Validate
    if (file.size > 6 * 1024 * 1024) {
      throw new Error('File too large');
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', options.type);
      formData.append('frequency', JSON.stringify(options.frequency));

      // Add other fields based on options...

      const response = await fetch(
        'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark',
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return await response.blob();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addWatermark, loading, error };
}
```

# Performance Considerations

- Expected processing time: 2-8 seconds
- Rate limit: ~30 requests per minute
- Max file size: 6MB
- No caching (API is stateless and ephemeral)

# Mental Model
This API is STATELESS and EPHEMERAL:
- NO storage: Images are never saved
- NO caching: Don't cache responses
- NO permanent URLs: No image persistence
- Synchronous: Get immediate binary response

# Implementation Checklist
- [ ] Validate file size (6MB max) before upload
- [ ] Validate file type (JPG/PNG/WebP only)
- [ ] Use JSON.stringify() for frequency parameter
- [ ] Include Authorization Bearer token
- [ ] Handle blob response correctly (not JSON)
- [ ] Implement error handling for all status codes
- [ ] Show loading state (2-8 seconds)
- [ ] Cleanup object URLs (prevent memory leaks)
- [ ] Use NotoSansThai for Thai text
- [ ] Implement rate limit retry with exponential backoff
- [ ] Show character counter (200 max)
- [ ] Display helpful validation messages

Build a complete watermark upload component with form validation, loading states, error handling, and preview functionality following these requirements exactly.
```

---

## Support

For issues or questions:
- Check [API-GUIDE.md](./API-GUIDE.md) for detailed usage
- Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for technical details
- Contact backend team for JWT token issues

---

**Base URL**: https://silly-seahorse-49d00d.netlify.app
**Endpoint**: `POST /.netlify/functions/watermark`
**Auth**: JWT Bearer Token Required
**Max File Size**: 6MB
**Max Processing Time**: 10 seconds
