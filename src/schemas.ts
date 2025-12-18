import { z } from '@hono/zod-openapi';

export const FrequencyModeSchema = z.enum(['single', 'grid', 'diagonal_tile']);
export const PositionSchema = z.enum([
  'top-left', 'top-center', 'top-right', 
  'center-left', 'center', 'center-right', 
  'bottom-left', 'bottom-center', 'bottom-right'
]);
export const WatermarkTypeSchema = z.enum(['text', 'image']);
export const OutputFormatSchema = z.enum(['png', 'jpeg', 'webp']);

export const FrequencySchema = z.object({
  mode: FrequencyModeSchema.openapi({ description: 'Watermark placement mode' }),
  position: PositionSchema.optional().default('bottom-right').openapi({ description: 'Position for single mode' }),
  margin_px: z.coerce.number().int().min(0).max(500).optional().default(24).openapi({ description: 'Margin in pixels' }),
  spacing_px: z.coerce.number().int().min(20).max(2000).optional().default(280).openapi({ description: 'Spacing for grid/tile modes' }),
});

export const CreateWatermarkSchema = z.object({
  type: WatermarkTypeSchema.openapi({ description: 'Type of watermark' }),
  
  // We need to parse JSON strings if they come from multipart/form-data as text fields, 
  // but Hono might handle JSON parts if sent as application/json. 
  // For multipart/form-data, complex objects are usually sent as JSON strings.
  // We'll handle the "string to object" conversion in the handler or using z.preprocess if needed.
  // For OpenAPI definition, we describe the object structure.
  frequency: FrequencySchema.openapi({ description: 'Frequency configuration' }),
  
  text: z.string().max(200).optional().openapi({ description: 'Text for text watermark' }),
  font: z.string().optional().openapi({ description: 'Font family' }),
  font_weight: z.coerce.number().int().min(100).max(900).optional().default(400),
  font_size: z.coerce.number().int().min(8).max(512).optional().default(32),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#FFFFFF').openapi({ example: '#FFFFFF', description: 'Hex color code' }),
  
  wm_scale: z.coerce.number().min(0.01).max(5).optional().default(0.2).openapi({ description: 'Scale factor for image watermark' }),
  opacity: z.coerce.number().min(0).max(1).optional().default(0.18).openapi({ description: 'Opacity (0-1)' }),
  angle_deg: z.coerce.number().int().min(-180).max(180).optional().default(-30),
  
  output_format: OutputFormatSchema.optional().default('png'),
  quality: z.coerce.number().int().min(1).max(100).optional().default(90),

  // File fields are usually not part of the JSON schema body in the same way for Zod unless we use z.instanceof(File) or similar.
  // For OpenAPI multipart, we define them separately or as 'string' format 'binary'.
  image: z.any().openapi({ type: 'string', format: 'binary', description: 'Main image to watermark' }),
  wm_image: z.any().optional().openapi({ type: 'string', format: 'binary', description: 'Watermark image (if type=image)' }),
});
