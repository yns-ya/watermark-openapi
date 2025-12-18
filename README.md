# 🌊 Watermark API - OpenAPI Serverless

> **High-performance serverless image watermarking API with OpenAPI 3.0 documentation**

A blazing-fast, serverless watermark API built with **Hono**, **OpenAPI**, and deployed on **Netlify Functions**. Designed for seamless integration with web applications, particularly optimized for the [converter-on-vercel](https://github.com/converter-on-vercel) project.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

## ✨ Key Features

- 🚀 **Serverless & Fast** - Edge-optimized with Netlify Functions
- 📖 **OpenAPI 3.0** - Interactive Swagger UI documentation
- 🎨 **Text & Image Watermarks** - Flexible watermarking options
- 🔄 **Multiple Patterns** - Single, grid, and diagonal tile positioning
- 🖼️ **Format Support** - PNG, JPEG, WebP input/output
- 🔐 **Secure** - JWT Bearer authentication
- 🌐 **CORS Ready** - Configurable CORS for web integration
- ⚡ **High Performance** - Optimized with Sharp library
- 💾 **Stateless** - No storage, fully ephemeral processing
- 📱 **Web-Friendly** - Perfect for browser-based apps

## 🎯 Live Demo

Once deployed, your API will have:

- **Swagger UI**: `https://your-domain.netlify.app/ui` 📚
- **OpenAPI Spec**: `https://your-domain.netlify.app/doc` 📄
- **API Endpoint**: `https://your-domain.netlify.app/watermark` 🚀

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yns-ya/watermark-openapi.git
cd watermark-openapi

# Install dependencies (requires pnpm)
pnpm install

# Copy environment file
cp .env.example .env
```

### 2. Configuration

Edit `.env`:

```env
# Authentication
JWT_SECRET=your-super-secret-key-here

# CORS (comma-separated origins)
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000

# Limits
MAX_FILE_SIZE=6291456      # 6MB
MAX_IMAGE_WIDTH=4096
MAX_IMAGE_HEIGHT=4096
```

### 3. Development

```bash
# Start local dev server
pnpm start:dev

# API available at: http://localhost:3000
# Swagger UI at: http://localhost:3000/ui
```

### 4. Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Netlify Deploy:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## 📖 API Documentation

For complete API documentation with examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Quick Example

```bash
curl -X POST https://your-domain.netlify.app/watermark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "type=text" \
  -F "text=© Copyright 2025" \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":280}' \
  -F "opacity=0.2" \
  -o watermarked.png
```

## 🔐 Authentication

Generate a test JWT token:

```bash
pnpm run generate-jwt
```

This creates a token you can use for testing. In production, implement proper JWT issuance.

## 🏗️ Architecture

```
watermark-openapi/
├── src/
│   ├── app.ts                      # Hono app with OpenAPI routes
│   ├── schemas.ts                  # Zod/OpenAPI schemas
│   ├── adapters/
│   │   └── standalone-services.ts  # OOP services (Sharp processing)
│   └── modules/
│       └── watermark/
│           └── dto/                # TypeScript DTOs
├── netlify/
│   └── functions/
│       └── watermark.ts            # Netlify function handler
├── netlify.toml                    # Netlify configuration
├── API_DOCUMENTATION.md            # Complete API docs
└── README.md                       # You are here
```

### Technology Stack

- **Framework**: [Hono](https://hono.dev/) - Ultra-fast web framework
- **OpenAPI**: [@hono/zod-openapi](https://github.com/honojs/middleware) - Type-safe OpenAPI
- **Schema Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) - High-performance image manipulation
- **Serverless**: Netlify Functions
- **Docs**: Swagger UI

## 🎨 Watermark Capabilities

### Text Watermarks
- Custom text up to 200 characters
- Multiple fonts (NotoSansThai, Roboto, Inter)
- Configurable size, color, opacity, rotation
- Font weights: 100-900

### Image Watermarks
- Upload custom watermark images
- Scalable (0.01-5x)
- Opacity control
- Automatic sizing

### Positioning Modes

1. **Single** - Place watermark at specific position
   - top-left, top-right, bottom-left, bottom-right, center

2. **Grid** - Regular grid pattern
   - Configurable spacing (20-2000px)

3. **Diagonal Tile** - Security-focused diagonal pattern
   - Configurable spacing (20-2000px)
   - Harder to remove

## 🔗 Integration with Converter Project

This API is designed to work with `/Users/benzsrg/Documents/benz-project/converter-on-vercel/`.

### Integration Example

**In your converter project:**

```typescript
// config.ts
export const WATERMARK_API = {
  endpoint: 'https://your-watermark-api.netlify.app/watermark',
  token: process.env.WATERMARK_API_TOKEN
};

// watermark.ts
async function addWatermark(file: File, config: WatermarkConfig) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', config.type);
  formData.append('frequency', JSON.stringify(config.frequency));
  
  if (config.type === 'text') {
    formData.append('text', config.text);
    formData.append('opacity', String(config.opacity));
  }
  
  const response = await fetch(WATERMARK_API.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WATERMARK_API.token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Watermark failed');
  }
  
  return await response.blob();
}
```

## 📊 Performance & Limits

| Metric | Value |
|--------|-------|
| Max File Size | 6MB |
| Max Dimensions | 4096x4096 px |
| Processing Time | 1-3s typical |
| Cold Start | <500ms |
| Supported Formats | JPEG, PNG, WebP |
| Max Text Length | 200 characters |

## 🛡️ Security

- ✅ JWT Bearer token authentication
- ✅ CORS configuration
- ✅ File type validation (magic numbers)
- ✅ Input sanitization
- ✅ Size limits enforced
- ✅ No data persistence
- ✅ Ephemeral processing only

## 📚 Documentation Files

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [SECURITY.md](./SECURITY.md) - Security & privacy policy

## 🔧 Development

### Available Scripts

```bash
pnpm start:dev        # Start local dev server
pnpm build:netlify    # Build for Netlify
pnpm generate-jwt     # Generate test token
pnpm lint             # Lint code
pnpm format           # Format code
pnpm test             # Run tests
```

### Local Testing

```bash
# Start Netlify dev server
netlify dev

# Or use pnpm
pnpm start:dev
```

## 🌍 Environment Variables

Set these in Netlify dashboard or `.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ⚠️ Yes | - | JWT signing secret |
| `ALLOWED_ORIGINS` | No | `*` | CORS origins (comma-separated) |
| `MAX_FILE_SIZE` | No | `6291456` | Max file size in bytes |
| `MAX_IMAGE_WIDTH` | No | `4096` | Max image width |
| `MAX_IMAGE_HEIGHT` | No | `4096` | Max image height |

## 🤝 Contributing

Contributions welcome! This project follows:
- OOP best practices
- SOLID principles
- TypeScript strict mode
- Functional programming where appropriate

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hono](https://hono.dev/)
- Image processing by [Sharp](https://sharp.pixelplumbing.com/)
- Deployed on [Netlify](https://www.netlify.com/)

---

**Repository**: https://github.com/yns-ya/watermark-openapi  
**Status**: ✅ Production Ready  
**API Type**: RESTful with OpenAPI 3.0  
**Deployment**: Serverless (Netlify Functions)

Made with ❤️ for high-performance image processing
