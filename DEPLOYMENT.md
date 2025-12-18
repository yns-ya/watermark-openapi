# Netlify Deployment Guide

This project supports deployment to Netlify Functions while preserving the OOP architecture. The Netlify handler delegates to standalone OOP services under `src/adapters/standalone-services.ts`.

## Prerequisites
- Netlify account and a new site (or link an existing one)
- Netlify CLI: `npm i -g netlify-cli`
- Node 18 on Netlify (configured in `netlify.toml`)
- pnpm is used as the package manager

## Environment Variables
Set these in the Netlify UI (Site settings > Build & deploy > Environment):

- JWT_SECRET: Strong random string (>= 32 chars)
- ALLOWED_ORIGINS: Comma-separated list (e.g., https://yourdomain.com)
- MAX_FILE_SIZE: 6291456 (6MB free tier limit)
- MAX_IMAGE_WIDTH: 4096
- MAX_IMAGE_HEIGHT: 4096
- NODE_ENV: production (automatically set by context in `netlify.toml`)

Tip: You can set them with CLI:

```
netlify env:set JWT_SECRET "<secure random>"
netlify env:set ALLOWED_ORIGINS "https://yourdomain.com"
netlify env:set MAX_FILE_SIZE "6291456"
netlify env:set MAX_IMAGE_WIDTH "4096"
netlify env:set MAX_IMAGE_HEIGHT "4096"
```

## Build and Deploy

1) Link the site (once):
```
netlify init
```

2) Preview deploy from local:
```
netlify deploy
```

3) Production deploy:
```
netlify deploy --prod
```

The build uses `pnpm install && pnpm build:netlify` per `netlify.toml`.

## Local Development

- Start NestJS locally for API exploration:
```
pnpm start:dev
```
- Start Netlify Dev to emulate functions and redirects:
```
netlify dev
```
Netlify Dev proxies `/api/*` to `/.netlify/functions/:splat` via `netlify.toml` redirects.

## Endpoints

- Function base: `/.netlify/functions/watermark`
- With redirect (recommended): `/api/watermark`

Send a POST multipart/form-data request including:
- `image`: the source image file
- Optional `wm_image`: watermark image when `type=image`
- DTO fields documented in README under API usage (or inline with your client)

Example curl:
```
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -F "image=@/path/to/input.png" \
  -F 'type=text' \
  -F 'text=Sample' \
  -F 'frequency={"mode":"diagonal_tile","spacing_px":280}' \
  https://<your-site>.netlify.app/api/watermark --output out.png
```

## OOP Architecture on Netlify

- The Netlify function `netlify/functions/watermark.ts` instantiates:
  - `StandaloneImageProcessorService`
  - `StandaloneFileUploadService`
  - `StandaloneWatermarkService`
- DTO validation is performed with `class-validator`
- No persistent storage is used; responses are returned as binary with `Cache-Control: no-store`

## Limits and Notes
- Free tier: 6MB request body, ~10s execution, ~1024MB memory
- Supported formats: JPEG, PNG, WebP
- Fonts: Embedded via SVG for text watermark; bundled fonts included via `included_files` in `netlify.toml`
- Sharp is marked as external in `netlify.toml` and bundled by esbuild

## Troubleshooting
- 401 Unauthorized: Provide a valid `Authorization: Bearer <JWT>`
- 400 Validation: Check DTO fields
- 413 Entity Too Large: Ensure `MAX_FILE_SIZE` <= 6MB
- Function logs: Netlify dashboard > Functions > Logs

