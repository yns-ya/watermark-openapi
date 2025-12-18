import 'reflect-metadata';
import { handle } from 'hono/netlify';
import app from '../../src/app';

// Debug/Fix wrapper for local dev
export const handler = async (event: any, context: any) => {
  // Netlify Dev (local) sometimes doesn't populate rawUrl which Hono expects
  if (!event.rawUrl) {
    const host = event.headers['host'] || event.headers['Host'] || 'localhost:8888';
    const proto = event.headers['x-forwarded-proto'] || 'http';
    event.rawUrl = `${proto}://${host}${event.path}`;
  }
  
  try {
    const handlerFn = handle(app);
    return await handlerFn(event, context);
  } catch (err: any) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        message: err.message,
        stack: err.stack 
      }),
    };
  }
};
