import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import * as busboy from 'busboy';
import { Readable } from 'stream';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Import Standalone OOP Services (no NestJS dependency)
import {
  StandaloneImageProcessorService,
  StandaloneFileUploadService,
  StandaloneWatermarkService,
} from '../../src/adapters/standalone-services';
import { CreateWatermarkDto } from '../../src/modules/watermark/dto/watermark.dto';

/**
 * Netlify Function Handler with OOP Architecture
 *
 * This serverless function instantiates OOP services on each request,
 * maintaining SOLID principles while working within Netlify's constraints.
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      }),
    };
  }

  try {
    // JWT Authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization token',
        }),
      };
    }

    const token = authHeader.substring(7);

    // Simple JWT validation (you can use jsonwebtoken for full validation)
    if (!token || token.length < 20) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Invalid JWT token',
        }),
      };
    }

    // Instantiate OOP Services (Dependency Injection pattern)
    const imageProcessorService = new StandaloneImageProcessorService();
    const fileUploadService = new StandaloneFileUploadService();
    const watermarkService = new StandaloneWatermarkService(
      imageProcessorService,
      fileUploadService
    );

    // Parse multipart form data
    const result = await parseMultipartForm(event);

    // Validate DTO using class-validator (OOP validation)
    const dto = plainToInstance(CreateWatermarkDto, result.fields);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: errors.map(e => Object.values(e.constraints || {}).join(', ')),
        }),
      };
    }

    // Add watermark image buffer if provided
    if (result.files.wm_image) {
      (dto as any).wm_image_buffer = result.files.wm_image;
    }

    // Process watermark using OOP service
    const processedImage = await watermarkService.processWatermark(
      result.files.image,
      dto
    );

    // Return binary image
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': processedImage.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      body: processedImage.buffer.toString('base64'),
      isBase64Encoded: true,
    };

  } catch (error: any) {
    console.error('Watermark processing error:', error);

    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
      }),
    };
  }
};

/**
 * Parse multipart/form-data using busboy
 */
function parseMultipartForm(event: HandlerEvent): Promise<{
  fields: Record<string, any>;
  files: Record<string, Buffer>;
}> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, any> = {};
    const files: Record<string, Buffer> = {};

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return reject(new Error('Content-Type must be multipart/form-data'));
    }

    const bb = busboy({
      headers: {
        'content-type': contentType,
      },
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '6291456'),
        files: 2, // image + wm_image
        fields: 20,
      },
    });

    bb.on('file', (fieldname: string, file: Readable, info: any) => {
      const chunks: Buffer[] = [];

      file.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        files[fieldname] = Buffer.concat(chunks);
      });
    });

    bb.on('field', (fieldname: string, value: string) => {
      // Parse JSON fields
      if (fieldname === 'frequency') {
        try {
          fields[fieldname] = JSON.parse(value);
        } catch {
          fields[fieldname] = value;
        }
      } else if (fieldname === 'opacity') {
        fields[fieldname] = parseFloat(value);
      } else if (fieldname === 'font_size') {
        fields[fieldname] = parseInt(value);
      } else {
        fields[fieldname] = value;
      }
    });

    bb.on('finish', () => {
      resolve({ fields, files });
    });

    bb.on('error', (error: Error) => {
      reject(error);
    });

    // Convert base64 body to buffer and pipe to busboy
    const bodyBuffer = Buffer.from(event.body || '', 'base64');
    const readable = Readable.from(bodyBuffer);
    readable.pipe(bb);
  });
}
