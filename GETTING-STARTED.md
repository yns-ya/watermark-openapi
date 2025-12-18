# Getting Started with Watermark API

Quick setup guide for the Watermark API project using pnpm.

## Prerequisites

- **Node.js 18+**: `node --version`
- **pnpm**: Install with `npm install -g pnpm`
- **Git**: For version control
- **Netlify account**: For deployment (free tier)

## Project Setup

### 1. Install Dependencies

```bash
# Install with pnpm
pnpm install

# This will:
# ✓ Install all dependencies
# ✓ Build Sharp for your platform
# ✓ Set up TypeScript
```

### 2. Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set your values
# Required:
#   JWT_SECRET=your-super-secret-key-min-32-chars
```

**Generate secure JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Download Fonts

Download these fonts and place in `netlify/functions/watermark/assets/fonts/`:

- **NotoSansThai-Regular.ttf** - [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Thai)
- **Roboto-Regular.ttf** - [Google Fonts](https://fonts.google.com/specimen/Roboto)
- **Inter-Regular.ttf** - [Google Fonts](https://fonts.google.com/specimen/Inter)

```bash
# Create fonts directory
mkdir -p netlify/functions/watermark/assets/fonts

# Download fonts manually and move to fonts directory
# Or use wget/curl (example):
cd netlify/functions/watermark/assets/fonts
# Download font files here
```

### 4. Local Development

```bash
# Start Netlify Dev server
pnpm dev

# Server starts at: http://localhost:8888
# Function URL: http://localhost:8888/.netlify/functions/watermark
```

### 5. Test Locally

```bash
# Generate a test JWT token
pnpm run generate-jwt

# Test with curl
curl -X POST http://localhost:8888/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_GENERATED_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "type=text" \
  -F "text=TEST WATERMARK" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"diagonal_tile"}' \
  --output result.png
```

## Deployment to Netlify

### Option 1: Connect Git Repository (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/watermark-api.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings are auto-configured via `netlify.toml`
   - Click "Deploy site"

3. **Set Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add: `JWT_SECRET`, `ALLOWED_ORIGINS`, etc.

4. **Auto-Deploy:**
   - Every push to `main` branch triggers automatic deployment
   - Preview deployments for other branches
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for details

### Option 2: Manual Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## Project Structure

```
watermark-openapi/
├── netlify/
│   └── functions/
│       └── watermark/           # Function implementation goes here
│           ├── index.ts         # Main handler
│           ├── types.ts         # TypeScript types
│           ├── validation.ts    # Zod schemas
│           ├── auth.ts          # JWT validation
│           ├── parser.ts        # Multipart parsing
│           ├── processor.ts     # Image processing
│           └── assets/
│               └── fonts/       # Font files
├── scripts/
│   └── generate-token.js        # JWT token generator
├── package.json                 # Dependencies (pnpm)
├── tsconfig.json                # TypeScript config
├── netlify.toml                 # Netlify configuration
├── .env.example                 # Environment template
├── .nvmrc                       # Node version
├── .npmrc                       # pnpm configuration
├── .gitignore                   # Git ignore rules
├── README.md                    # Project overview
├── API-DOCS.md                  # Complete API reference
├── API-GUIDE.md                 # Usage examples
├── FRONTEND-INTEGRATION.md      # Frontend guide
├── IMPLEMENTATION.md            # Implementation details
├── DEPLOYMENT.md                # Deployment guide
├── SECURITY.md                  # Security policy
├── CHECKLIST.md                 # Production checklist
└──  .yaml                       # OpenAPI specification
```

## Available Scripts

```bash
# Development
pnpm dev                # Start local dev server
pnpm build              # Build TypeScript
pnpm type-check         # Check types without building

# Deployment
pnpm deploy             # Deploy to production
pnpm deploy:preview     # Deploy preview

# Utilities
pnpm generate-jwt       # Generate JWT token for testing
pnpm setup              # Install deps + create directories
```

## Next Steps

1. **Read the documentation:**
   - [API-DOCS.md](./API-DOCS.md) - Complete API reference
   - [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md) - Frontend integration
   - [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Implementation guide

2. **Implement the function:**
   - Code examples are in [IMPLEMENTATION.md](./IMPLEMENTATION.md)
   - Create files in `netlify/functions/watermark/`
   - Follow TypeScript types and Zod schemas

3. **Test thoroughly:**
   - Test all watermark modes
   - Test error cases
   - Test with various image sizes
   - Use [CHECKLIST.md](./CHECKLIST.md)

4. **Deploy:**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Set up auto-deploy with Git
   - Configure environment variables
   - Monitor function logs

## Common Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Generate JWT for testing
pnpm generate-jwt

# Type check
pnpm type-check

# Build for production
pnpm build

# Deploy to Netlify
netlify deploy --prod

# View function logs
netlify functions:log watermark

# Open Netlify dashboard
netlify open
```

## Troubleshooting

### pnpm not found

```bash
npm install -g pnpm
```

### Sharp installation fails

```bash
# Force rebuild for your platform
pnpm rebuild sharp
```

### TypeScript errors

```bash
# Check for errors
pnpm type-check

# Fix any type issues before deploying
```

### Function not working locally

```bash
# Make sure Netlify CLI is installed
npm install -g netlify-cli

# Restart dev server
pnpm dev
```

## Important Notes

1. **This is a stateless API** - No images are stored
2. **pnpm is required** - npm/yarn won't work (enforced by preinstall)
3. **Fonts must be downloaded** - Not included in repository
4. **JWT_SECRET must be set** - Required for authentication
5. **Auto-deploy enabled** - Push to main triggers deployment

## Support

- **Documentation issues:** Check all .md files
- **Deployment issues:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API issues:** See [API-DOCS.md](./API-DOCS.md)
- **Security questions:** See [SECURITY.md](./SECURITY.md)

---

**Quick Links:**
- Live API: https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark
- Documentation: [API-DOCS.md](./API-DOCS.md)
- Frontend Guide: [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md)

**Status:** ✅ Configured for Netlify auto-deploy with pnpm
