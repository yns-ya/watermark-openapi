/**
 * JWT Token Generator for Watermark API
 *
 * Usage:
 *   node scripts/generate-token.js
 *   node scripts/generate-token.js --expires=24h
 *   node scripts/generate-token.js --user=john@example.com
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Parse command line arguments
const args = process.argv.slice(2);
const expiresIn = args.find(arg => arg.startsWith('--expires'))?.split('=')[1] || '1h';
const userId = args.find(arg => arg.startsWith('--user'))?.split('=')[1] || `user-${crypto.randomBytes(4).toString('hex')}`;

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('\n❌ Error: JWT_SECRET environment variable not set');
  console.error('\nPlease set it in your .env file or run:');
  console.error('  export JWT_SECRET="your-secret-here"\n');
  process.exit(1);
}

// Generate token
const payload = {
  sub: userId,
  iat: Math.floor(Date.now() / 1000),
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

// Decode to show expiration
const decoded = jwt.decode(token);
const expiresAt = new Date(decoded.exp * 1000);

console.log('\n✅ JWT Token Generated Successfully\n');
console.log('Token:');
console.log(token);
console.log('\nUser ID:', userId);
console.log('Expires In:', expiresIn);
console.log('Expires At:', expiresAt.toISOString());
console.log('\nUsage:');
console.log(`  curl -H "Authorization: Bearer ${token}" ...`);
console.log('\n');
