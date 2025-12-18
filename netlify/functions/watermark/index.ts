/**
 * Watermark API - Main Handler (STUB)
 *
 * TODO: Implement the full watermark functionality
 * See IMPLEMENTATION.md for complete implementation guide
 *
 * This is a minimal stub to allow deployment.
 * Replace this with the full implementation from IMPLEMENTATION.md
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

function errorResponse(
  status: number,
  code: string,
  message: string
): { statusCode: number; headers: Record<string, string>; body: string } {
  const error: ErrorResponse = { code, message };
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(error),
  };
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
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
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  }

  // TODO: Implement full functionality
  // See IMPLEMENTATION.md for complete code

  return errorResponse(
    501,
    'NOT_IMPLEMENTED',
    'API endpoint is deployed but not yet implemented. See IMPLEMENTATION.md for implementation guide.'
  );
};
