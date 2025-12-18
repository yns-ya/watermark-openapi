import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  StandaloneImageProcessorService,
  StandaloneFileUploadService,
  StandaloneWatermarkService,
} from './adapters/standalone-services';
import { CreateWatermarkDto } from './modules/watermark/dto/watermark.dto';
import { plainToInstance } from 'class-transformer';

const app = new Hono();

// CORS
// CORS
app.use('*', cors({
  origin: (origin) => {
    const allowed = ['https://converter-on-vercel.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];
    if (!origin) return '*'; // Allow non-browser requests (e.g. cURL)
    
    // Check specific allowed origins
    if (allowed.includes(origin)) {
      return origin; 
    }
    
    // Check wildcard if set (allow all) - but return specific origin for credentials to work
    if (process.env.ALLOWED_ORIGINS === '*') {
      return origin;
    }
    
    return origin; // Fallback: Reflect origin to allow currently (User requested fix, let's be permissive but correct for credentials)
  },
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  maxAge: 600,
  credentials: true,
}));

// Dependency Injection
const imageProcessorService = new StandaloneImageProcessorService();
const fileUploadService = new StandaloneFileUploadService();
const watermarkService = new StandaloneWatermarkService(
  imageProcessorService,
  fileUploadService
);

// Standard Hono Route without OpenAPI overhead
app.post('/watermark', async (c) => {
  // Authorization check removed per user requirement for public/frontend access

  try {
    const body = await c.req.parseBody();
    
    // Map Input Parameters
    const type = body['type'] as string;
    const isTiled = String(body['isTiled']) === 'true';
    const tileGap = Number(body['tileGap'] || 200);
    const position = (body['position'] as string) || 'center';

    const frequency = {
        mode: isTiled ? 'grid' : 'single',
        spacing_px: tileGap,
        position: position
    };

    const dtoData: any = {
      type: type,
      frequency: frequency,
      opacity: Number(body['opacity'] || 0.5),
      output_format: 'png',
      quality: 90,
    };

    if (type === 'text') {
        dtoData.text = body['text'];
        dtoData.font = body['fontFamily'] || 'Roboto';
        dtoData.font_size = Number(body['fontSize'] || 32);
        dtoData.color = body['color'] || '#FFFFFF';
    } else if (type === 'image') {
         dtoData.wm_scale = Number(body['scale'] || 0.5);
    }

    const imageFile = body['image'];
    const wmImageFile = body['watermarkImage'] || body['wm_image']; // Support both for backward compatibility if needed, but prioritize new

    // Convert File to Buffer
    const getBuffer = async (file: any): Promise<Buffer | null> => {
        if (!file) return null;
        if (file instanceof File) {
            return Buffer.from(await file.arrayBuffer());
        }
        return null; // Handle generic object or strings if Hono parses differently?
    };

    const imageBuffer = await getBuffer(imageFile);
    if (!imageBuffer) {
        return c.json({ error: 'VALIDATION_ERROR', message: 'Image file (image) is required' }, 400);
    }
    
    if (type === 'image') {
        if (!wmImageFile) {
             return c.json({ error: 'VALIDATION_ERROR', message: 'Watermark image (watermarkImage) is required for image type' }, 400);
        }
        dtoData.wm_image_buffer = await getBuffer(wmImageFile);
    }

    const dto = plainToInstance(CreateWatermarkDto, dtoData);
    const result = await watermarkService.processWatermark(imageBuffer, dto);

    return c.body(result.buffer as any, 200, {
      'Content-Type': result.contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });

  } catch (error: any) {
    console.error('Error processing watermark:', error);
    return c.json({
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    }, 500);
  }
});

// Simple health check
app.get('/', (c) => c.text('Watermark API is running'));

export default app;
