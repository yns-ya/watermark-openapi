export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },

  // File Upload Limits
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 6 * 1024 * 1024, // 6MB
    maxImageWidth: parseInt(process.env.MAX_IMAGE_WIDTH, 10) || 4096,
    maxImageHeight: parseInt(process.env.MAX_IMAGE_HEIGHT, 10) || 4096,
  },

  // Watermark Configuration
  watermark: {
    maxTextLength: 200,
    maxFontSize: 512,
    minFontSize: 8,
    maxSpacing: 2000,
    minSpacing: 20,
    fontsPath: 'src/assets/fonts',
    availableFonts: ['NotoSansThai', 'Roboto', 'Inter'],
  },
});
