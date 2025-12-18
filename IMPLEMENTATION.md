# Watermark API - Implementation Guide

Complete guide for implementing and deploying the Watermark API on Netlify Functions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Implementation](#implementation)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Monitoring](#monitoring)

## Prerequisites

- Node.js 18+ and npm/yarn
- Netlify account
- Netlify CLI: `npm install -g netlify-cli`
- Git for version control
- Basic understanding of TypeScript and serverless functions

## Project Structure

```
watermark-openapi/
├── netlify/
│   └── functions/
│       └── watermark/
│           ├── index.ts              # Main function handler
│           ├── types.ts              # TypeScript types
│           ├── validation.ts         # Zod schemas
│           ├── auth.ts               # JWT authentication
│           ├── parser.ts             # Multipart form parser
│           ├── processor.ts          # Image processing logic
│           └── assets/
│               └── fonts/
│                   ├── NotoSansThai-Regular.ttf
│                   ├── Roboto-Regular.ttf
│                   └── Inter-Regular.ttf
├── package.json
├── tsconfig.json
├── netlify.toml
├── .env.example
├── README.md
├── API-GUIDE.md
└──  .yaml                            # OpenAPI spec
```

## Installation

### 1. Clone or Initialize Project

```bash
# If starting fresh
mkdir watermark-api && cd watermark-api
git init
```

### 2. Install Dependencies

```bash
npm init -y
npm install sharp busboy jsonwebtoken zod
npm install -D @types/node @types/busboy @types/jsonwebtoken typescript @netlify/functions
```

### 3. Download Font Files

Download and place in `netlify/functions/watermark/assets/fonts/`:

- [Noto Sans Thai](https://fonts.google.com/noto/specimen/Noto+Sans+Thai)
- [Roboto](https://fonts.google.com/specimen/Roboto)
- [Inter](https://fonts.google.com/specimen/Inter)

```bash
mkdir -p netlify/functions/watermark/assets/fonts
# Download .ttf files to the fonts directory
```

### 4. Create Configuration Files

**package.json** (add scripts):
```json
{
  "name": "watermark-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "netlify dev",
    "build": "tsc",
    "deploy": "netlify deploy --prod"
  },
  "dependencies": {
    "sharp": "^0.33.0",
    "busboy": "^1.6.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@netlify/functions": "^2.4.0",
    "@types/node": "^20.10.0",
    "@types/busboy": "^1.5.3",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.0"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./netlify",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["netlify/**/*"],
  "exclude": ["node_modules"]
}
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[dev]
  command = "npm run dev"
  port = 8888
  targetPort = 8888
```

**.env.example**:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
MAX_FILE_SIZE=6291456
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Environment Configuration

### 1. Create Local .env File

```bash
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

### 2. Set Netlify Environment Variables

```bash
netlify env:set JWT_SECRET "your-super-secret-jwt-key"
netlify env:set MAX_FILE_SIZE "6291456"
netlify env:set ALLOWED_ORIGINS "https://yourdomain.com"
```

Or via Netlify UI:
1. Go to Site Settings → Environment Variables
2. Add variables: `JWT_SECRET`, `MAX_FILE_SIZE`, `ALLOWED_ORIGINS`

## Implementation

### Step 1: Types (types.ts)

```typescript
export type WatermarkType = 'image' | 'text';
export type FrequencyMode = 'single' | 'grid' | 'diagonal_tile';
export type Position = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
export type OutputFormat = 'png' | 'jpeg' | 'webp';

export interface Frequency {
  mode: FrequencyMode;
  position?: Position;
  margin_px?: number;
  spacing_px?: number;
}

export interface WatermarkRequest {
  image: Buffer;
  type: WatermarkType;
  frequency: Frequency;
  wm_image?: Buffer;
  wm_scale?: number;
  text?: string;
  font?: string;
  font_weight?: number;
  font_size?: number;
  color?: string;
  opacity?: number;
  angle_deg?: number;
  output_format?: OutputFormat;
  quality?: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
```

### Step 2: Validation (validation.ts)

```typescript
import { z } from 'zod';

export const FrequencySchema = z.object({
  mode: z.enum(['single', 'grid', 'diagonal_tile']),
  position: z.enum(['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center']).optional(),
  margin_px: z.number().min(0).max(500).optional(),
  spacing_px: z.number().min(20).max(2000).optional(),
});

export const WatermarkRequestSchema = z.object({
  type: z.enum(['image', 'text']),
  frequency: FrequencySchema,
  wm_scale: z.number().min(0.01).max(5).optional(),
  text: z.string().max(200).optional(),
  font: z.string().optional(),
  font_weight: z.number().min(100).max(900).optional(),
  font_size: z.number().min(8).max(512).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  opacity: z.number().min(0).max(1).optional(),
  angle_deg: z.number().min(-180).max(180).optional(),
  output_format: z.enum(['png', 'jpeg', 'webp']).optional(),
  quality: z.number().min(1).max(100).optional(),
});

export function validateRequest(data: unknown) {
  return WatermarkRequestSchema.parse(data);
}
```

### Step 3: Authentication (auth.ts)

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
```

### Step 4: Multipart Parser (parser.ts)

```typescript
import Busboy from 'busboy';
import { Handler } from '@netlify/functions';

export interface ParsedFormData {
  fields: Record<string, string>;
  files: Record<string, Buffer>;
}

export async function parseMultipart(
  headers: Record<string, string>,
  body: string,
  isBase64: boolean
): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: Record<string, Buffer> = {};

    const busboy = Busboy({ headers });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        files[name] = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', (error) => {
      reject(error);
    });

    const buffer = Buffer.from(body, isBase64 ? 'base64' : 'utf-8');
    busboy.write(buffer);
    busboy.end();
  });
}
```

### Step 5: Image Processor (processor.ts)

```typescript
import sharp from 'sharp';
import path from 'path';
import { WatermarkRequest, Frequency } from './types';

const FONT_DIR = path.join(__dirname, 'assets', 'fonts');

const FONT_MAP: Record<string, string> = {
  'NotoSansThai': path.join(FONT_DIR, 'NotoSansThai-Regular.ttf'),
  'Roboto': path.join(FONT_DIR, 'Roboto-Regular.ttf'),
  'Inter': path.join(FONT_DIR, 'Inter-Regular.ttf'),
};

export async function processWatermark(request: WatermarkRequest): Promise<Buffer> {
  const {
    image,
    type,
    frequency,
    wm_image,
    wm_scale = 0.2,
    text,
    font = 'Roboto',
    font_size = 32,
    color = '#FFFFFF',
    opacity = 0.18,
    angle_deg = -30,
    output_format = 'png',
    quality = 90,
  } = request;

  let processedImage = sharp(image);
  const metadata = await processedImage.metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  // Create watermark
  let watermark: Buffer;
  if (type === 'image' && wm_image) {
    watermark = await createImageWatermark(wm_image, width, height, wm_scale, opacity);
  } else if (type === 'text' && text) {
    watermark = await createTextWatermark(text, font, font_size, color, opacity, angle_deg);
  } else {
    throw new Error('Invalid watermark configuration');
  }

  // Apply watermark based on frequency mode
  const watermarkPositions = calculatePositions(frequency, width, height, watermark);

  // Composite watermarks
  processedImage = processedImage.composite(
    watermarkPositions.map(pos => ({
      input: watermark,
      left: pos.x,
      top: pos.y,
    }))
  );

  // Output
  const outputOptions = output_format === 'jpeg' || output_format === 'webp'
    ? { quality }
    : {};

  return processedImage[output_format](outputOptions).toBuffer();
}

async function createImageWatermark(
  wmImage: Buffer,
  targetWidth: number,
  targetHeight: number,
  scale: number,
  opacity: number
): Promise<Buffer> {
  const shortSide = Math.min(targetWidth, targetHeight);
  const wmSize = Math.round(shortSide * scale);

  return sharp(wmImage)
    .resize(wmSize, wmSize, { fit: 'inside' })
    .composite([{
      input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: 'dest-in',
    }])
    .toBuffer();
}

async function createTextWatermark(
  text: string,
  font: string,
  fontSize: number,
  color: string,
  opacity: number,
  angle: number
): Promise<Buffer> {
  // This is simplified - actual implementation would use canvas or similar
  // for text rendering with custom fonts
  const svg = `
    <svg width="500" height="100">
      <text
        x="250"
        y="50"
        font-family="${font}"
        font-size="${fontSize}"
        fill="${color}"
        opacity="${opacity}"
        text-anchor="middle"
        transform="rotate(${angle} 250 50)"
      >${text}</text>
    </svg>
  `;

  return Buffer.from(svg);
}

interface Position {
  x: number;
  y: number;
}

function calculatePositions(
  frequency: Frequency,
  width: number,
  height: number,
  watermark: Buffer
): Position[] {
  const positions: Position[] = [];

  switch (frequency.mode) {
    case 'single':
      positions.push(calculateSinglePosition(frequency, width, height));
      break;
    case 'grid':
      positions.push(...calculateGridPositions(frequency, width, height));
      break;
    case 'diagonal_tile':
      positions.push(...calculateDiagonalPositions(frequency, width, height));
      break;
  }

  return positions;
}

function calculateSinglePosition(frequency: Frequency, width: number, height: number): Position {
  const margin = frequency.margin_px || 24;
  const position = frequency.position || 'bottom_right';

  const positionMap: Record<string, Position> = {
    'top_left': { x: margin, y: margin },
    'top_right': { x: width - margin, y: margin },
    'bottom_left': { x: margin, y: height - margin },
    'bottom_right': { x: width - margin, y: height - margin },
    'center': { x: width / 2, y: height / 2 },
  };

  return positionMap[position];
}

function calculateGridPositions(frequency: Frequency, width: number, height: number): Position[] {
  const spacing = frequency.spacing_px || 280;
  const positions: Position[] = [];

  for (let y = spacing / 2; y < height; y += spacing) {
    for (let x = spacing / 2; x < width; x += spacing) {
      positions.push({ x, y });
    }
  }

  return positions;
}

function calculateDiagonalPositions(frequency: Frequency, width: number, height: number): Position[] {
  const spacing = frequency.spacing_px || 280;
  const positions: Position[] = [];
  const offset = spacing / 2;

  for (let y = -spacing; y < height + spacing; y += spacing) {
    for (let x = -spacing; x < width + spacing; x += spacing) {
      positions.push({
        x: x + (y % (spacing * 2) === 0 ? 0 : offset),
        y
      });
    }
  }

  return positions;
}
```

### Step 6: Main Handler (index.ts)

```typescript
import { Handler } from '@netlify/functions';
import { extractToken, verifyToken } from './auth';
import { parseMultipart } from './parser';
import { validateRequest } from './validation';
import { processWatermark } from './processor';
import { ErrorResponse } from './types';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '6291456', 10);

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', headers);
  }

  try {
    // Authentication
    const token = extractToken(event.headers.authorization);
    if (!token || !verifyToken(token)) {
      return errorResponse(401, 'UNAUTHORIZED', 'Invalid or missing token', headers);
    }

    // Parse multipart form data
    const { fields, files } = await parseMultipart(
      event.headers as Record<string, string>,
      event.body || '',
      event.isBase64Encoded || false
    );

    // Check file size
    const imageSize = files.image?.length || 0;
    if (imageSize > MAX_FILE_SIZE) {
      return errorResponse(413, 'PAYLOAD_TOO_LARGE', 'Image is too large', headers);
    }

    // Validate request
    const parsedFrequency = JSON.parse(fields.frequency || '{}');
    const validatedData = validateRequest({
      ...fields,
      frequency: parsedFrequency,
    });

    // Type-specific validation
    if (validatedData.type === 'image' && !files.wm_image) {
      return errorResponse(400, 'BAD_REQUEST', 'wm_image is required when type=image', headers);
    }
    if (validatedData.type === 'text' && !fields.text) {
      return errorResponse(400, 'BAD_REQUEST', 'text is required when type=text', headers);
    }

    // Process watermark
    const result = await processWatermark({
      image: files.image,
      wm_image: files.wm_image,
      ...validatedData,
      text: fields.text,
      font: fields.font,
    });

    // Return image
    const contentType = `image/${validatedData.output_format || 'png'}`;
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
      body: result.toString('base64'),
      isBase64Encoded: true,
    };

  } catch (error) {
    console.error('Processing error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return errorResponse(400, 'BAD_REQUEST', error.message, headers);
    }

    return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected processing error', headers);
  }
};

function errorResponse(
  status: number,
  code: string,
  message: string,
  headers: Record<string, string>
): { statusCode: number; headers: Record<string, string>; body: string } {
  const error: ErrorResponse = { code, message };
  return {
    statusCode: status,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(error),
  };
}
```

## Testing

### Local Testing

```bash
# Start local dev server
netlify dev

# Test endpoint
curl -X POST http://localhost:8888/.netlify/functions/watermark \
  -H "Authorization: Bearer test-token" \
  -F "image=@test-image.jpg" \
  -F "type=text" \
  -F "text=TEST" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"diagonal_tile"}' \
  --output result.png
```

### Generate Test JWT

```javascript
// generate-token.js
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'test-user' },
  process.env.JWT_SECRET || 'your-secret',
  { expiresIn: '1h' }
);
console.log(token);
```

```bash
node generate-token.js
```

## Deployment

### Deploy to Netlify

```bash
# First time setup
netlify init

# Deploy to production
netlify deploy --prod

# Or use Git integration
git add .
git commit -m "Initial watermark API implementation"
git push origin main
# Netlify will auto-deploy
```

### Post-Deployment

1. Note your function URL: `https://your-site.netlify.app/.netlify/functions/watermark`
2. Update `servers.url` in OpenAPI spec
3. Test production endpoint
4. Monitor function logs: `netlify functions:log watermark`

## Monitoring

### Check Logs

```bash
# Stream logs
netlify functions:log watermark --stream

# Or via Netlify UI
# Functions → watermark → Function log
```

### Performance Metrics

Monitor in Netlify UI:
- Invocation count
- Execution duration
- Error rate
- Bandwidth usage

### Rate Limiting (Optional)

Add rate limiting using Netlify Edge Functions or external service (Cloudflare, etc.).

## Troubleshooting

### Common Issues

**Sharp installation fails**:
```bash
npm install --platform=linux --arch=x64 sharp
```

**Function timeout**:
- Reduce max image size
- Optimize watermark processing
- Consider upgrading to Netlify Pro for longer timeouts

**Memory errors**:
- Reduce MAX_FILE_SIZE
- Process smaller images
- Use streaming where possible

## Next Steps

1. Add rate limiting
2. Implement image size optimization
3. Add support for more fonts
4. Create admin dashboard for JWT management
5. Add analytics/usage tracking
6. Implement caching for repeated requests

---

For API usage, see [README.md](./README.md) and [API-GUIDE.md](./API-GUIDE.md)
