# Pre-Production Checklist

Complete this checklist before deploying to production.

## 🔐 Security

- [ ] `JWT_SECRET` is set to a strong, random value (min 32 characters)
  ```bash
  # Generate a secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] `JWT_SECRET` is stored in Netlify environment variables (not in code)
- [ ] CORS `ALLOWED_ORIGINS` is configured for your production domain(s)
- [ ] Rate limiting is implemented or configured
- [ ] All environment variables are set in Netlify dashboard
- [ ] `.env` file is in `.gitignore` (never commit secrets)
- [ ] Test JWT token generation: `npm run generate-jwt`

## 📦 Dependencies

- [ ] All dependencies are installed: `npm install`
- [ ] Security audit passed: `npm audit`
- [ ] No high-severity vulnerabilities
- [ ] Dependencies are up to date: `npm outdated`
- [ ] TypeScript builds without errors: `npm run type-check`

## 🎨 Fonts

- [ ] Font files are downloaded and placed in `netlify/functions/watermark/assets/fonts/`
  - [ ] `NotoSansThai-Regular.ttf`
  - [ ] `Roboto-Regular.ttf`
  - [ ] `Inter-Regular.ttf`
- [ ] Font paths are correctly mapped in `processor.ts`
- [ ] Font whitelist is enforced (no runtime font fetching)
- [ ] Test with Thai characters
- [ ] Test with English characters

## 🧪 Testing

- [ ] Test text watermark locally
  ```bash
  netlify dev
  # Then test with curl or Postman
  ```
- [ ] Test image watermark locally
- [ ] Test all frequency modes: `single`, `grid`, `diagonal_tile`
- [ ] Test all output formats: `png`, `jpeg`, `webp`
- [ ] Test with various image sizes (small, medium, large)
- [ ] Test error cases:
  - [ ] Missing JWT token (should return 401)
  - [ ] Invalid JWT token (should return 401)
  - [ ] File too large (should return 413)
  - [ ] Invalid file type (should return 415)
  - [ ] Missing required fields (should return 400)
  - [ ] Invalid frequency JSON (should return 400)

## 🔧 Configuration

- [ ] `netlify.toml` is configured correctly
- [ ] Function timeout is set (10s for Free tier)
- [ ] Memory allocation is set (1024MB)
- [ ] Node version is specified (18+)
- [ ] External modules are configured (sharp)
- [ ] Security headers are configured
- [ ] Cache-Control headers prevent caching

## 📝 Code Quality

- [ ] No TODO/FIXME comments in production code
- [ ] Error messages don't expose sensitive information
- [ ] No console.log of sensitive data (images, tokens, etc.)
- [ ] All file paths use path.join (platform-independent)
- [ ] Input validation is comprehensive (Zod schemas)
- [ ] Type safety is enforced (strict TypeScript)

## 🏗 Architecture Verification

- [ ] **STATELESS**: No file writes to disk anywhere
- [ ] **EPHEMERAL**: All processing in memory only
- [ ] **NO STORAGE**: No databases, no S3, no CDN uploads
- [ ] **NO CACHING**: Response headers prevent caching
- [ ] **SYNCHRONOUS**: No background jobs or queues
- [ ] **IMMEDIATE**: Response sent directly after processing

## 🌐 Deployment

- [ ] Netlify CLI is installed: `npm install -g netlify-cli`
- [ ] Logged in to Netlify: `netlify login`
- [ ] Site is linked: `netlify link` or `netlify init`
- [ ] Environment variables are set in Netlify:
  ```bash
  netlify env:set JWT_SECRET "your-secret"
  netlify env:set ALLOWED_ORIGINS "https://yourdomain.com"
  ```
- [ ] Preview deployment works: `netlify deploy`
- [ ] Production deployment: `netlify deploy --prod`
- [ ] Function URL is noted and documented

## 📚 Documentation

- [ ] `README.md` is complete and accurate
- [ ] `API-GUIDE.md` has usage examples
- [ ] `IMPLEMENTATION.md` has setup instructions
- [ ] `SECURITY.md` documents privacy guarantees
- [ ] OpenAPI spec ( .yaml) is accurate
- [ ] Function URL is updated in documentation
- [ ] Example curl commands are tested

## 🚀 Performance

- [ ] Images process in < 10 seconds (Free tier limit)
- [ ] Test with maximum allowed file size (6MB)
- [ ] Test with maximum dimensions (4096x4096)
- [ ] Memory usage stays under 1024MB
- [ ] No memory leaks in repeated requests
- [ ] Sharp is optimized for serverless (correct build target)

## 📊 Monitoring

- [ ] Netlify function logs are accessible
- [ ] Error tracking is set up (optional: Sentry, etc.)
- [ ] Usage metrics are monitored
- [ ] Rate limiting is working (if implemented)

## 🔍 Privacy Verification

Run these checks to ensure no data persistence:

```bash
# 1. Search for any file writes
grep -r "writeFile\|createWriteStream\|fs.write" netlify/functions/

# 2. Search for database connections
grep -r "mongoose\|pg\|mysql\|mongodb\|redis" netlify/functions/

# 3. Search for external uploads
grep -r "s3\|cloudinary\|imgur\|uploadcare" netlify/functions/

# 4. Verify Cache-Control headers
# Check that responses include: Cache-Control: no-store
```

All searches should return **NO RESULTS**.

## ✅ Final Checks

- [ ] OpenAPI spec version matches package.json version
- [ ] All links in README work
- [ ] License is specified
- [ ] Contact/support information is provided
- [ ] Backup JWT secret securely
- [ ] Document JWT rotation procedure
- [ ] Create runbook for common issues

## 🎯 Post-Deployment

- [ ] Test production endpoint with real requests
- [ ] Verify CORS headers in browser
- [ ] Check function execution time in Netlify dashboard
- [ ] Monitor error rates
- [ ] Set up alerts for:
  - [ ] High error rate (>5%)
  - [ ] Long execution times (>8s)
  - [ ] High memory usage (>900MB)
- [ ] Document function URL for users
- [ ] Share API documentation with team

## 🐛 Known Issues / Limitations

Document any known limitations:

- [ ] Max file size: 6MB (Netlify Free tier)
- [ ] Max execution time: 10s (Netlify Free tier)
- [ ] Max dimensions: 4096x4096 (configurable)
- [ ] Supported formats: JPG, PNG, WebP only
- [ ] Supported fonts: 3 bundled fonts only

## 📅 Maintenance Schedule

- [ ] Weekly: Check Netlify function logs
- [ ] Monthly: Run `npm audit` and update dependencies
- [ ] Monthly: Check for Sharp security updates
- [ ] Quarterly: Review and rotate JWT secret
- [ ] Quarterly: Review rate limits and adjust if needed

---

## Sign-off

- [ ] Developer: Code reviewed and tested
- [ ] Security: Security review completed
- [ ] Ops: Deployment verified
- [ ] Product: API meets requirements

**Date**: _________________

**Deployed By**: _________________

**Production URL**: _________________

---

**Mental Model Verification:**

This API is a **Stateless Image Transformer**:
- ✅ Receive → Transform → Return → Forget
- ❌ NO storage, NO caching, NO persistence

If anything persists after response, the implementation is WRONG.
