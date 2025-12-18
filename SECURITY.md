# Security & Privacy Policy

## Stateless Processing Guarantee

This API is designed as a **Stateless, Ephemeral Image Transformer** with the following guarantees:

### What We DO NOT Do

- **NO Storage**: Images are never written to disk or any storage service
- **NO Caching**: Images are never cached on server, CDN, or browser
- **NO Logging**: Binary image data is never logged
- **NO Persistence**: All data is forgotten after the response is sent
- **NO URLs**: No permanent URLs are generated for processed images
- **NO Background Jobs**: All processing is synchronous and completes before response
- **NO External Fetching**: No runtime fetching of fonts or watermark resources from user-provided URLs

### What We DO

- **In-Memory Only**: All processing happens exclusively in RAM
- **Immediate Response**: Processed image is returned directly in the response body
- **Auto-Cleanup**: Memory is freed immediately after response
- **Input Validation**: All inputs are validated before processing
- **Rate Limiting**: Protection against abuse

## Privacy Architecture

```
Request → Parse → Validate → Process (RAM only) → Response → Forget Everything
```

After the response is sent, **no trace** of the image exists on our infrastructure.

## Security Measures

### 1. Authentication

- **JWT Bearer Tokens**: All requests require valid JWT authentication
- **Token Validation**: Tokens are verified on every request
- **Token Expiration**: Tokens must include `exp` claim

### 2. Input Validation

All inputs are validated before processing:

```typescript
✅ File type validation (JPG, PNG, WebP only)
✅ File size limits (≤ 6MB for Free tier)
✅ Image dimension limits (≤ 4096x4096 pixels)
✅ Text length limits (≤ 200 characters)
✅ Font whitelist enforcement
✅ Parameter range validation (opacity, angle, size, etc.)
```

### 3. Font Security

**Whitelist-Only Approach:**
- Fonts are bundled with the deployment
- Only pre-approved fonts are available
- Font names are mapped to local file paths
- **NEVER** accept font URLs from users
- **NEVER** fetch fonts at runtime

**Bundled Fonts:**
```
netlify/functions/watermark/assets/fonts/
  ├── NotoSansThai-Regular.ttf
  ├── Roboto-Regular.ttf
  └── Inter-Regular.ttf
```

### 4. Resource Limits

**Netlify Free Tier Constraints:**
- Max execution time: 10 seconds
- Max payload size: 6 MB
- Max memory: 1024 MB

**Application-Level Limits:**
- Max image size: 6 MB
- Max image dimensions: 4096 x 4096 pixels
- Max watermark text: 200 characters
- Max font size: 512px
- Max spacing: 2000px

Requests exceeding these limits receive `413 Payload Too Large`.

### 5. CORS Policy

Cross-Origin Resource Sharing is configured to:
- Allow specific origins only (configured via `ALLOWED_ORIGINS`)
- Require `Authorization` header
- Allow only `POST` method for watermark endpoint
- Allow `OPTIONS` for preflight requests

### 6. Rate Limiting

**Recommended Implementation:**
- 30 requests per minute per IP (configurable)
- Use Netlify Edge Functions or external service for enforcement
- Return `429 Too Many Requests` when exceeded

### 7. Error Handling

**Security-Conscious Error Messages:**

```typescript
❌ BAD: "Failed to read image at /tmp/upload_abc123.jpg"
✅ GOOD: "Invalid image format"

❌ BAD: "JWT verification failed: JsonWebTokenError: invalid signature at ..."
✅ GOOD: "Invalid or missing authentication token"

❌ BAD: "Sharp processing error: [stack trace]"
✅ GOOD: "Unexpected processing error"
```

**Never expose:**
- Internal file paths
- Stack traces
- Library versions
- Server configuration details

### 8. MIME Type Validation

Not just file extension checking:

```typescript
✅ Validate actual file content (magic numbers)
✅ Use Sharp's built-in format detection
✅ Reject files that don't match expected MIME type
✅ Return 415 Unsupported Media Type for invalid files
```

### 9. Cache Control Headers

Every response includes headers to prevent caching:

```http
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
```

This ensures:
- Browsers don't cache processed images
- CDNs don't cache responses
- Proxies don't store images

### 10. Content Security

**Prevent Injection Attacks:**

```typescript
✅ Sanitize text watermark input (prevent SVG injection)
✅ Validate color hex codes (prevent CSS injection)
✅ Validate numeric parameters (prevent buffer overflows)
✅ Use type-safe validation (Zod schemas)
```

## OWASP Top 10 Compliance

### A01: Broken Access Control
✅ JWT authentication on all endpoints
✅ No file system access
✅ No path traversal risk (no file storage)

### A02: Cryptographic Failures
✅ JWT secret stored in environment variables
✅ Tokens validated with strong algorithms (HS256/RS256)
✅ No sensitive data persisted

### A03: Injection
✅ Input validation with Zod schemas
✅ Text sanitization for SVG rendering
✅ No SQL/NoSQL (no database)
✅ No shell commands

### A04: Insecure Design
✅ Stateless architecture by design
✅ No session management needed
✅ Ephemeral processing only

### A05: Security Misconfiguration
✅ Security headers configured in netlify.toml
✅ Error messages don't leak information
✅ No default credentials

### A06: Vulnerable Components
✅ Dependencies regularly updated
✅ Sharp (actively maintained, security-focused)
✅ Minimal dependency tree

### A07: Identification Failures
✅ JWT-based authentication
✅ No session management (stateless)

### A08: Software Integrity Failures
✅ Fonts bundled (not fetched at runtime)
✅ No CDN dependencies for runtime code

### A09: Logging Failures
✅ No sensitive data logged
✅ No image binary logged
✅ Structured error logging only

### A10: SSRF
✅ No external HTTP requests
✅ No URL fetching from user input
✅ All resources bundled locally

## Threat Model

### Threats We Mitigate

1. **Data Leakage**: No storage = no data to leak
2. **SSRF**: No external fetching
3. **Path Traversal**: No file system writes
4. **Injection**: Input validation + sanitization
5. **DoS**: Rate limiting + resource limits
6. **Unauthorized Access**: JWT authentication

### Residual Risks

1. **Memory-based attacks**: Mitigated by resource limits
2. **CPU exhaustion**: Mitigated by timeout + rate limits
3. **Credential compromise**: Use strong JWT secrets, rotate regularly

## Security Checklist

Before deploying to production:

- [ ] JWT_SECRET is set to a strong, random value (min 32 characters)
- [ ] ALLOWED_ORIGINS is configured for your domain
- [ ] Rate limiting is enabled
- [ ] All fonts are bundled and whitelisted
- [ ] MAX_FILE_SIZE and dimension limits are set
- [ ] Error messages don't expose internals
- [ ] Cache-Control headers are set to no-store
- [ ] CORS is properly configured
- [ ] Input validation is comprehensive
- [ ] Dependencies are up to date (npm audit)

## Incident Response

If a security issue is discovered:

1. **Do NOT** create a public issue
2. Email: security@yourdomain.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

## Security Updates

- Check for Sharp updates monthly: `npm outdated sharp`
- Review dependencies: `npm audit`
- Update JWT library when security patches released
- Monitor Netlify security advisories

## Compliance

This API is designed to comply with:

- **GDPR**: No personal data stored
- **CCPA**: No data retention
- **Privacy-by-Design**: Stateless architecture ensures privacy

Since no data is persisted, there is nothing to delete, export, or rectify.

## Questions?

For security questions or concerns, contact: security@yourdomain.com

---

**Last Updated**: 2025-12-18
**Security Model**: Stateless, Ephemeral Processing
**Data Retention**: Zero (0) - Nothing persists after response
