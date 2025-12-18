# Watermark API Documentation

A high-performance serverless image watermarking API built with Hono, OpenAPI, and deployed on Netlify Functions.

## 🚀 Features

- ✅ **OpenAPI 3.0 Specification** - Fully documented with Swagger UI
- ✅ **Text Watermarks** - Custom text with configurable fonts, colors, and styles
- ✅ **Image Watermarks** - Apply image overlays with opacity and scaling
- ✅ **Flexible Positioning** - Single position, grid, or diagonal tile patterns
- ✅ **Multiple Output Formats** - PNG, JPEG, WebP
- ✅ **Serverless & Stateless** - No database, all processing in-memory
- ✅ **Fast & Optimized** - Powered by Sharp for high-performance image processing
- ✅ **Security** - JWT Bearer token authentication
- ✅ **CORS Support** - Configurable origins

## 📚 Interactive Documentation

Once deployed, access the interactive Swagger UI at:

```
https://your-domain.netlify.app/ui
```

Or view the raw OpenAPI spec at:

```
https://your-domain.netlify.app/doc
```

## 🔐 Authentication

All API endpoints require Bearer token authentication. Include your JWT token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Generate a Test Token

For development/testing, you can generate a simple token:

```bash
pnpm run generate-jwt
```

## 📖 API Reference

### POST /watermark

Apply a watermark to an image.

#### Request

**Content-Type:** `multipart/form-data`

**Headers:**
- `Authorization: Bearer {token}` (required)

**Form Fields:**

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `image` | File | ✅ | Image file to watermark (PNG/JPEG/WebP, max 6MB) | - |
| `type` | string | ✅ | Watermark type: `text` or `image` | - |
| `frequency` | JSON string | ✅ | Frequency configuration (see below) | - |
| `text` | string | Conditional* | Text for text watermark (max 200 chars) | - |
| `font` | string | ❌ | Font family (`NotoSansThai`, `Roboto`, `Inter`) | `Roboto` |
| `font_size` | number | ❌ | Font size (8-512) | `32` |
| `font_weight` | number | ❌ | Font weight (100-900) | `400` |
| `color` | string | ❌ | Hex color code (e.g., `#FFFFFF`) | `#FFFFFF` |
| `wm_image` | File | Conditional** | Watermark image file (for image type) | - |
| `wm_scale` | number | ❌ | Scale factor for image watermark (0.01-5) | `0.2` |
| `opacity` | number | ❌ | Opacity (0-1) | `0.18` |
| `angle_deg` | number | ❌ | Rotation angle (-180 to 180) | `-30` |
| `output_format` | string | ❌ | Output format: `png`, `jpeg`, or `webp` | `png` |
| `quality` | number | ❌ | Output quality (1-100, for JPEG/WebP) | `90` |

*Required when `type=text`  
**Required when `type=image`

#### Frequency Configuration

The `frequency` field must be a JSON string with the following structure:

```json
{
  "mode": "single|grid|diagonal_tile",
  "position": "top_left|top_right|bottom_left|bottom_right|center",
  "margin_px": 24,
  "spacing_px": 280
}
```

**Modes:**
- `single` - Single watermark at specified position
- `grid` - Grid pattern across the image
- `diagonal_tile` - Diagonal tiled pattern

**Fields:**
- `mode` (required): Placement mode
- `position` (optional): Position for single mode (default: `bottom_right`)
- `margin_px` (optional): Margin in pixels (0-500, default: `24`)
- `spacing_px` (optional): Spacing for grid/tile modes (20-2000, default: `280`)

#### Response

**Success (200 OK):**
- **Content-Type:** `image/png`, `image/jpeg`, or `image/webp`
- **Body:** Binary image data
- **Headers:**
  - `Cache-Control: no-store, no-cache, must-revalidate`

**Error Responses:**

- **400 Bad Request** - Invalid parameters
- **401 Unauthorized** - Missing or invalid authentication token
- **500 Internal Server Error** - Processing error

## 💡 Usage Examples

### cURL Example (Text Watermark)

```bash
curl -X POST https://your-domain.netlify.app/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@input.jpg" \
  -F "type=text" \
  -F "text=Confidential Document" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":300}' \
  -F "opacity=0.25" \
  -F "color=#FF0000" \
  -F "output_format=png" \
  -o watermarked.png
```

### cURL Example (Image Watermark)

```bash
curl -X POST https://your-domain.netlify.app/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=image" \
  -F "wm_image=@logo.png" \
  -F 'frequency={"mode":"single","position":"bottom_right"}' \
  -F "opacity=0.5" \
  -F "wm_scale=0.15" \
  -F "output_format=jpeg" \
  -o watermarked.jpg
```

### JavaScript Example (Fetch API)

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('type', 'text');
formData.append('text', 'Sample Watermark');
formData.append('frequency', JSON.stringify({
  mode: 'grid',
  spacing_px: 250
}));
formData.append('opacity', '0.2');
formData.append('output_format', 'png');

const response = await fetch('https://your-domain.netlify.app/watermark', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
// Use url for display or download
```

### Python Example (requests)

```python
import requests

url = 'https://your-domain.netlify.app/watermark'
headers = {
    'Authorization': 'Bearer YOUR_TOKEN'
}

files = {
    'image': open('input.jpg', 'rb')
}

data = {
    'type': 'text',
    'text': 'Watermark Text',
    'frequency': '{"mode":"diagonal_tile","spacing_px":280}',
    'opacity': '0.18',
    'color': '#FFFFFF',
    'output_format': 'png'
}

response = requests.post(url, headers=headers, files=files, data=data)

if response.status_code == 200:
    with open('watermarked.png', 'wb') as f:
        f.write(response.content)
```

## 🏗️ Integration with Converter Project

This API is designed to integrate seamlessly with the `/Users/benzsrg/Documents/benz-project/converter-on-vercel/` project.

### Integration Steps:

1. **Update API Endpoint** in your converter project:

```javascript
const WATERMARK_API_URL = 'https://your-watermark-api.netlify.app/watermark';
const WATERMARK_API_TOKEN = 'your-bearer-token';
```

2. **Call the API** from your converter:

```javascript
async function addWatermark(imageFile, watermarkConfig) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('type', watermarkConfig.type);
  formData.append('frequency', JSON.stringify(watermarkConfig.frequency));
  
  // Add other config fields...
  
  const response = await fetch(WATERMARK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WATERMARK_API_TOKEN}`
    },
    body: formData
  });
  
  return await response.blob();
}
```

3. **Handle the Response**:

```javascript
const watermarkedBlob = await addWatermark(file, {
  type: 'text',
  text: 'Copyright Notice',
  frequency: { mode: 'single', position: 'bottom_right' },
  opacity: 0.3
});

// Download or display
const url = URL.createObjectURL(watermarkedBlob);
```

## 🔧 Configuration

### Environment Variables

Set these in your Netlify dashboard or `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `6291456` (6MB) |
| `MAX_IMAGE_WIDTH` | Maximum image width in pixels | `4096` |
| `MAX_IMAGE_HEIGHT` | Maximum image height in pixels | `4096` |

## 📊 Limits & Constraints

- **File Size**: Maximum 6MB per upload
- **Image Dimensions**: Maximum 4096x4096 pixels
- **Supported Formats**: JPEG, PNG, WebP
- **Text Length**: Maximum 200 characters for text watermarks

## 🎨 Watermark Patterns

### Single Position
Perfect for logos or copyright notices in a specific corner.

```json
{
  "mode": "single",
  "position": "bottom_right",
  "margin_px": 24
}
```

### Grid Pattern
Ideal for document protection with regular spacing.

```json
{
  "mode": "grid",
  "spacing_px": 200
}
```

### Diagonal Tile
Best for security watermarks that are hard to remove.

```json
{
  "mode": "diagonal_tile",
  "spacing_px": 280
}
```

## 🛡️ Security Best Practices

1. **Token Management**: Store JWT tokens securely, never in client-side code
2. **HTTPS Only**: Always use HTTPS in production
3. **Origin Control**: Set `ALLOWED_ORIGINS` to specific domains
4. **Rate Limiting**: Implement rate limiting at the Netlify or application level
5. **Input Validation**: API validates all inputs, but always validate on client side too

## 🚦 Performance Tips

1. **Optimize Input Images**: Resize large images before uploading
2. **Choose Appropriate Output Format**: 
   - PNG for transparency/quality
   - JPEG for photos
   - WebP for best compression
3. **Adjust Quality**: Lower quality (70-85) significantly reduces file size
4. **Minimize Watermark Complexity**: Simpler patterns process faster

## 📝 License

MIT

## 🤝 Support

For issues or questions, please open an issue in the repository.
