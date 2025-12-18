# Deployment Guide - Netlify Auto-Build

This guide explains how to set up automatic deployments to Netlify when you push to your Git repository.

## Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket)
- Netlify account (free tier works perfectly)
- pnpm installed locally: `npm install -g pnpm`

## Quick Start

### 1. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Watermark API"
```

### 2. Push to GitHub/GitLab/Bitbucket

```bash
# GitHub example
git remote add origin https://github.com/yourusername/watermark-api.git
git branch -M main
git push -u origin main
```

### 3. Connect to Netlify

#### Option A: Via Netlify Web UI (Recommended)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub/GitLab/Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your watermark-api repository
6. Configure build settings:

   ```
   Build command: pnpm install && pnpm run build
   Publish directory: public
   Functions directory: netlify/functions
   ```

7. Click "Deploy site"

#### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Follow prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: watermark-api (or custom)
# - Build command: pnpm install && pnpm run build
# - Functions directory: netlify/functions
# - Deploy site
```

### 4. Configure Environment Variables

**Via Netlify Web UI:**

1. Go to Site Settings → Environment Variables
2. Add these variables:

   ```
   JWT_SECRET = your-super-secret-key-min-32-chars
   MAX_FILE_SIZE = 6291456
   MAX_IMAGE_WIDTH = 4096
   MAX_IMAGE_HEIGHT = 4096
   ALLOWED_ORIGINS = https://yourdomain.com
   NODE_ENV = production
   ```

**Via Netlify CLI:**

```bash
netlify env:set JWT_SECRET "your-super-secret-key"
netlify env:set MAX_FILE_SIZE "6291456"
netlify env:set ALLOWED_ORIGINS "https://yourdomain.com"
```

**Generate a secure JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Upload Font Files

Since font files are large, you have two options:

#### Option A: Commit fonts to repository

```bash
# Download fonts to local directory
# Place them in netlify/functions/watermark/assets/fonts/

# Add and commit
git add netlify/functions/watermark/assets/fonts/
git commit -m "Add font files"
git push
```

#### Option B: Upload via Netlify CLI

```bash
# After deploying, upload fonts
netlify deploy --dir=netlify/functions/watermark/assets/fonts --functions
```

**Required fonts:**
- `NotoSansThai-Regular.ttf` - [Download](https://fonts.google.com/noto/specimen/Noto+Sans+Thai)
- `Roboto-Regular.ttf` - [Download](https://fonts.google.com/specimen/Roboto)
- `Inter-Regular.ttf` - [Download](https://fonts.google.com/specimen/Inter)

### 6. Test the Deployment

```bash
# Get your site URL from Netlify
netlify open

# Test the function
curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/watermark \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "type=text" \
  -F "text=TEST" \
  -F "font=Roboto" \
  -F 'frequency={"mode":"diagonal_tile"}' \
  --output result.png
```

## Auto-Build Configuration

Once connected, Netlify automatically builds and deploys on every push to your main branch.

### What Happens on Push

```
1. Git push → GitHub/GitLab/Bitbucket
   ↓
2. Webhook triggers Netlify build
   ↓
3. Netlify clones repository
   ↓
4. Runs: pnpm install
   ↓
5. Runs: pnpm run build (TypeScript compilation)
   ↓
6. Deploys functions to /.netlify/functions/
   ↓
7. Site live with new changes
```

### Build Settings Configured

These are automatically set via `netlify.toml`:

```toml
[build]
  command = "pnpm install && pnpm run build"
  functions = "netlify/functions"
  publish = "public"

[build.environment]
  NODE_VERSION = "18"
  PNPM_VERSION = "9.0.0"
```

### Branch Deploys

**Main branch:**
- Automatically deploys to production URL
- Example: `https://watermark-api.netlify.app`

**Other branches:**
- Create preview deployments
- Example: `https://feature-branch--watermark-api.netlify.app`

### Pull Request Previews

Netlify automatically creates preview deployments for pull requests:

1. Create a PR on GitHub
2. Netlify builds and deploys a preview
3. Preview URL appears in PR comments
4. Test before merging

## Continuous Deployment Workflow

### Standard Workflow

```bash
# 1. Make changes locally
vim netlify/functions/watermark/processor.ts

# 2. Test locally
pnpm dev

# 3. Commit changes
git add .
git commit -m "Improve watermark positioning"

# 4. Push to trigger auto-deploy
git push origin main

# 5. Netlify automatically:
#    - Detects push
#    - Runs build
#    - Deploys new version
#    - Site live in 30-60 seconds
```

### Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/improve-fonts

# 2. Make changes
# ... edit files ...

# 3. Push feature branch
git push origin feature/improve-fonts

# 4. Netlify creates preview deployment
#    Preview URL: https://feature-improve-fonts--watermark-api.netlify.app

# 5. Test preview deployment

# 6. Merge to main
git checkout main
git merge feature/improve-fonts
git push origin main

# 7. Production deployment triggered automatically
```

## Monitoring Deployments

### Via Netlify Web UI

1. Go to https://app.netlify.com
2. Select your site
3. View "Deploys" tab
4. See build logs, deploy status, and history

### Via Netlify CLI

```bash
# List recent deploys
netlify deploy:list

# View deploy logs
netlify watch

# Open site in browser
netlify open
```

### Build Logs

Access build logs to debug issues:

```bash
# Via CLI
netlify watch

# Via Web UI
Site → Deploys → Click on deploy → View logs
```

## Rollback

If a deployment breaks something:

### Via Web UI

1. Go to Deploys
2. Find previous working deploy
3. Click "Publish deploy"
4. Site reverted instantly

### Via CLI

```bash
# List deploys
netlify deploy:list

# Rollback to specific deploy
netlify rollback --deploy-id=DEPLOY_ID
```

## Custom Domain Setup

### Add Custom Domain

1. Go to Site Settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed:

   ```
   Type: CNAME
   Name: api
   Value: your-site.netlify.app
   ```

5. Netlify auto-provisions SSL certificate

### Update CORS Configuration

After adding custom domain, update `ALLOWED_ORIGINS`:

```bash
netlify env:set ALLOWED_ORIGINS "https://api.yourdomain.com,https://yourdomain.com"
```

## Troubleshooting

### Build Fails: "pnpm: command not found"

**Solution:** Netlify should auto-detect pnpm from `package.json`. If not:

1. Check `netlify.toml` has `PNPM_VERSION = "9.0.0"`
2. Or use build command: `npm install -g pnpm && pnpm install && pnpm build`

### Build Fails: TypeScript Errors

**Solution:**

```bash
# Test locally first
pnpm run type-check

# Fix errors before pushing
```

### Function Not Found (404)

**Solution:**

1. Check function directory: `netlify/functions/watermark/`
2. Verify `netlify.toml` has correct `functions = "netlify/functions"`
3. Check function exports `handler` correctly

### Sharp Installation Issues

**Solution:**

Sharp needs to be built for the correct platform. Netlify handles this automatically, but if issues occur:

```toml
# Add to netlify.toml
[build.environment]
  SHARP_IGNORE_GLOBAL_LIBVIPS = "1"
```

### Environment Variables Not Working

**Solution:**

1. Verify variables are set in Netlify UI
2. Redeploy after adding variables
3. Check variable names match code exactly

### Fonts Not Loading

**Solution:**

1. Verify fonts are in `netlify/functions/watermark/assets/fonts/`
2. Check font file names match `FONT_MAP` in `processor.ts`
3. Ensure fonts are committed to repository or uploaded

## Security Checklist

Before going to production:

- [ ] JWT_SECRET is set to secure random value (32+ chars)
- [ ] JWT_SECRET is different from development
- [ ] Environment variables are configured in Netlify (not in code)
- [ ] ALLOWED_ORIGINS is set to your production domain(s)
- [ ] Fonts are uploaded and accessible
- [ ] Test deployment with real requests
- [ ] Monitor function logs for errors
- [ ] Set up uptime monitoring (optional)

## Performance Optimization

### Cold Starts

Netlify Functions may have cold starts (~1-2 seconds). To minimize:

1. Keep dependencies minimal
2. Preload fonts outside handler
3. Use esbuild bundler (already configured)

### Function Timeout

Free tier: 10 seconds max execution time

If hitting timeout:
- Reduce max image size
- Optimize image processing
- Consider upgrading to Netlify Pro (26s timeout)

## Cost Monitoring

**Netlify Free Tier Limits:**
- 125,000 function invocations/month
- 100 hours function runtime/month
- 100 GB bandwidth/month

**Monitor usage:**
1. Go to Site → Analytics
2. View "Functions" tab
3. Track invocations and runtime

## Useful Commands

```bash
# Check build locally (before pushing)
pnpm run build

# Test function locally
pnpm dev

# Deploy manually (bypass auto-deploy)
netlify deploy --prod

# View site logs
netlify functions:log watermark

# Open Netlify dashboard
netlify open

# Check site status
netlify status

# List environment variables
netlify env:list
```

## Next Steps

1. **Set up monitoring**: Use services like UptimeRobot or Checkly
2. **Add analytics**: Track API usage and errors
3. **Set up alerts**: Get notified of deployment failures
4. **Create staging environment**: Deploy to separate Netlify site for testing
5. **Document API endpoint**: Update frontend team with production URL

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Netlify Support**: https://answers.netlify.com
- **Build Issues**: Check deploy logs in Netlify UI
- **Function Issues**: `netlify functions:log watermark`

---

**Your Site URL:** https://silly-seahorse-49d00d.netlify.app

**Function Endpoint:** https://silly-seahorse-49d00d.netlify.app/.netlify/functions/watermark

**Auto-Deploy:** ✅ Enabled (pushes to main branch trigger deployment)

**Build Time:** ~30-60 seconds

**Deployment:** Zero-downtime, atomic deploys
