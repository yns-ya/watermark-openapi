# Watermark API - Detailed Usage Guide

## Table of Contents

1. [Authentication](#authentication)
2. [Watermark Modes](#watermark-modes)
3. [Use Cases & Examples](#use-cases--examples)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

## Authentication

The API uses JWT bearer tokens for authentication.

### Obtaining a Token

Contact your API administrator to obtain a JWT token. The token should include:
- `sub`: User ID
- `exp`: Expiration timestamp
- `iat`: Issued at timestamp

### Using the Token

Include the token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Validation

Tokens are validated on each request. Ensure:
- Token is not expired
- Token signature is valid
- Token is properly formatted

## Watermark Modes

### 1. Single Position Watermark

Place the watermark at a specific corner or center.

**Use case**: Logo in corner, subtle branding

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© My Company" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"single","position":"bottom_right","margin_px":24}' \
  -F "opacity=0.5" \
  -F "font_size=24" \
  --output result.png
```

**Available positions**:
- `top_left`
- `top_right`
- `bottom_left`
- `bottom_right`
- `center`

### 2. Grid Pattern Watermark

Place watermarks in a regular grid across the entire image.

**Use case**: Copyright protection, proof images

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=DRAFT" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"grid","spacing_px":200}' \
  -F "opacity=0.15" \
  -F "font_size=48" \
  -F "angle_deg=0" \
  --output result.png
```

### 3. Diagonal Tile Pattern

Place watermarks diagonally across the image (most popular for copyright protection).

**Use case**: Photo protection, preventing unauthorized use

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© 2025 Photographer Name" \
  -F "font=NotoSansThai" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":280}' \
  -F "opacity=0.18" \
  -F "font_size=32" \
  -F "angle_deg=-30" \
  -F "color=#FFFFFF" \
  --output result.png
```

## Use Cases & Examples

### Example 1: Subtle Logo Watermark

Add a transparent logo to the bottom-right corner.

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@product-photo.jpg" \
  -F "type=image" \
  -F "wm_image=@company-logo.png" \
  -F 'frequency={"mode":"single","position":"bottom_right","margin_px":30}' \
  -F "wm_scale=0.15" \
  -F "opacity=0.4" \
  -F "output_format=jpeg" \
  -F "quality=85" \
  --output branded-photo.jpg
```

### Example 2: Thai Text Copyright

Add Thai text watermark diagonally across the image.

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@artwork.jpg" \
  -F "type=text" \
  -F "text=© ห้ามคัดลอก 2025" \
  -F "font=NotoSansThai" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":300}' \
  -F "opacity=0.2" \
  -F "font_size=36" \
  -F "font_weight=600" \
  -F "angle_deg=-35" \
  -F "color=#000000" \
  --output protected.png
```

### Example 3: Large Watermark for Proof Images

Create a prominent "PROOF" watermark for client review.

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@client-photo.jpg" \
  -F "type=text" \
  -F "text=PROOF" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"single","position":"center"}' \
  -F "opacity=0.3" \
  -F "font_size=128" \
  -F "font_weight=900" \
  -F "angle_deg=-20" \
  -F "color=#FF0000" \
  -F "output_format=jpeg" \
  -F "quality=75" \
  --output proof.jpg
```

### Example 4: Dense Protection Watermark

Maximum protection with tight diagonal pattern.

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@high-value-image.png" \
  -F "type=text" \
  -F "text=© CONFIDENTIAL" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":150}' \
  -F "opacity=0.25" \
  -F "font_size=28" \
  -F "font_weight=700" \
  -F "angle_deg=-30" \
  --output protected.png
```

### Example 5: Multi-language Watermark

Combine English and Thai text.

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© Copyright 2025 | ห้ามทำซ้ำ" \
  -F "font=NotoSansThai" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":250}' \
  -F "opacity=0.2" \
  -F "font_size=30" \
  --output result.png
```

### Example 6: WebP Output for Web Use

Optimize for web with WebP format.

```bash
curl -X POST https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=image" \
  -F "wm_image=@logo.png" \
  -F 'frequency={"mode":"single","position":"bottom_right","margin_px":20}' \
  -F "wm_scale=0.12" \
  -F "opacity=0.5" \
  -F "output_format=webp" \
  -F "quality=80" \
  --output optimized.webp
```

## Best Practices

### Performance Optimization

1. **Image Size**: Keep source images under 4000x4000px for optimal performance
2. **Format Selection**:
   - Use `webp` for smallest file size
   - Use `jpeg` for photos (quality 80-90)
   - Use `png` for transparency or graphics
3. **Batch Processing**: Process images sequentially to avoid rate limits

### Security

1. **Token Management**:
   - Store JWT tokens securely (environment variables)
   - Rotate tokens regularly
   - Never expose tokens in client-side code

2. **Input Validation**:
   - Validate file types before upload
   - Check file sizes client-side
   - Sanitize user-provided text

### Watermark Effectiveness

1. **Opacity**:
   - `0.15-0.25`: Subtle, professional
   - `0.3-0.5`: Visible protection
   - `0.5+`: Strong deterrent (may affect image quality)

2. **Spacing** (for grid/diagonal_tile):
   - `400+px`: Sparse, elegant
   - `200-400px`: Standard protection
   - `150-200px`: Dense protection

3. **Rotation**:
   - `-30° to -35°`: Standard diagonal
   - `0°`: Horizontal (grid mode)
   - `-45°`: Strong diagonal

### Font Selection

- **Thai text**: Always use `NotoSansThai`
- **English branding**: `Roboto` or `Inter`
- **Mixed content**: `NotoSansThai` supports both

## Troubleshooting

### Common Errors

#### "wm_image is required when type=image"
**Solution**: Include the watermark image file when using `type=image`

```bash
-F "wm_image=@logo.png"
```

#### "Payload too large"
**Solution**: Resize your image before uploading

```bash
# Using ImageMagick
convert large-image.jpg -resize 3000x3000\> resized.jpg
```

#### "Unsupported media type"
**Solution**: Ensure file is JPG, PNG, or WebP

```bash
# Check file type
file photo.jpg

# Convert if needed
convert image.bmp image.jpg
```

#### "Invalid frequency JSON"
**Solution**: Ensure frequency parameter is valid JSON

```bash
# Correct
-F 'frequency={"mode":"diagonal_tile","spacing_px":280}'

# Incorrect (missing quotes)
-F frequency={mode:diagonal_tile}
```

### Rate Limiting

If you receive 429 errors:
1. Implement exponential backoff
2. Space out requests (max 1-2 per second)
3. Contact administrator to increase limits

### Quality Issues

**Watermark too faint**:
- Increase `opacity` (try 0.3-0.5)
- Increase `font_size` for text
- Use darker color for `color` parameter

**Watermark too prominent**:
- Decrease `opacity` (try 0.1-0.2)
- Increase `spacing_px` for grid/diagonal modes
- Use lighter color

**Output file too large**:
- Use `webp` format with quality 70-80
- Use `jpeg` format instead of `png`
- Reduce `quality` parameter

## JavaScript/TypeScript Example

```typescript
async function addWatermark(imagePath: string, token: string) {
  const formData = new FormData();
  formData.append('image', await fetch(imagePath).then(r => r.blob()));
  formData.append('type', 'text');
  formData.append('text', '© Copyright 2025');
  formData.append('font', 'Roboto');
  formData.append('frequency', JSON.stringify({
    mode: 'diagonal_tile',
    spacing_px: 280
  }));
  formData.append('opacity', '0.2');
  formData.append('output_format', 'webp');

  const response = await fetch(
    'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
```

## Python Example

```python
import requests

def add_watermark(image_path: str, token: str) -> bytes:
    url = 'https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark'

    files = {
        'image': open(image_path, 'rb')
    }

    data = {
        'type': 'text',
        'text': '© Copyright 2025',
        'font': 'Roboto',
        'frequency': '{"mode":"diagonal_tile","spacing_px":280}',
        'opacity': '0.2',
        'output_format': 'png'
    }

    headers = {
        'Authorization': f'Bearer {token}'
    }

    response = requests.post(url, files=files, data=data, headers=headers)
    response.raise_for_status()

    return response.content

# Usage
watermarked_image = add_watermark('photo.jpg', 'YOUR_TOKEN')
with open('watermarked.png', 'wb') as f:
    f.write(watermarked_image)
```

---

For implementation details, see [IMPLEMENTATION.md](./IMPLEMENTATION.md)
