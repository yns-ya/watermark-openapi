/**
 * Standalone OOP Services for Netlify Functions
 *
 * These classes maintain OOP architecture and SOLID principles
 * but work without NestJS decorators/runtime for serverless deployment.
 */

import sharp from 'sharp';
import { join } from 'path';
import { readFileSync } from 'fs';
import { CreateWatermarkDto, WatermarkType } from '../modules/watermark/dto/watermark.dto';
import { FrequencyMode } from '../modules/watermark/dto/frequency.dto';

/**
 * Standalone Image Processor Service (OOP)
 * Maintains Single Responsibility Principle
 */
export class StandaloneImageProcessorService {
  private readonly MAX_IMAGE_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '4096');
  private readonly MAX_IMAGE_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || '4096');

  /**
   * Process image with watermark
   * @param imageBuffer Original image buffer
   * @param dto Watermark configuration DTO
   * @returns Processed image buffer
   */
  async processWatermark(
    imageBuffer: Buffer,
    dto: CreateWatermarkDto
  ): Promise<{ buffer: Buffer; contentType: string }> {
    // Load and validate image
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }

    if (metadata.width > this.MAX_IMAGE_WIDTH || metadata.height > this.MAX_IMAGE_HEIGHT) {
      throw new Error(`Image dimensions exceed maximum (${this.MAX_IMAGE_WIDTH}x${this.MAX_IMAGE_HEIGHT})`);
    }

    // Create watermark overlay
    const watermarkBuffer = await this.createWatermark(dto, metadata.width, metadata.height);

    // Calculate positions based on frequency mode
    const positions = this.calculatePositions(
      dto.frequency.mode,
      metadata.width,
      metadata.height,
      dto.frequency
    );

    // Composite watermarks onto image
    const composites = positions.map(pos => ({
      input: watermarkBuffer,
      top: pos.top,
      left: pos.left,
      blend: 'over' as const,
    }));

    // Process image
    let outputImage = image.composite(composites);

    // Apply output format
    const format = dto.output_format || 'png';
    const contentType = this.getContentType(format);

    switch (format) {
      case 'jpeg':
        outputImage = outputImage.jpeg({ quality: 95 });
        break;
      case 'webp':
        outputImage = outputImage.webp({ quality: 95 });
        break;
      default:
        outputImage = outputImage.png();
    }

    const buffer = await outputImage.toBuffer();
    return { buffer, contentType };
  }

  /**
   * Create watermark SVG or image overlay
   */
  private async createWatermark(
    dto: CreateWatermarkDto,
    imageWidth: number,
    imageHeight: number
  ): Promise<Buffer> {
    if (dto.type === WatermarkType.TEXT) {
      return this.createTextWatermark(dto, imageWidth, imageHeight);
    } else {
      return this.createImageWatermark(dto, imageWidth, imageHeight);
    }
  }

  /**
   * Create text watermark as SVG
   */
  private async createTextWatermark(
    dto: CreateWatermarkDto,
    imageWidth: number,
    imageHeight: number
  ): Promise<Buffer> {
    const text = this.sanitizeText(dto.text || '');
    const fontSize = dto.font_size || 36;
    const color = dto.color || '#000000';
    const opacity = dto.opacity || 0.18;

    // Load font file
    const fontPath = this.getFontPath(dto.font || 'Roboto');
    const fontBuffer = readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString('base64');

    // Estimate text dimensions
    const textWidth = text.length * fontSize * 0.6;
    const textHeight = fontSize * 1.5;

    // Create SVG
    const svg = `
      <svg width="${Math.ceil(textWidth)}" height="${Math.ceil(textHeight)}">
        <defs>
          <style type="text/css">
            @font-face {
              font-family: 'CustomFont';
              src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            }
          </style>
        </defs>
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="CustomFont"
          font-size="${fontSize}"
          fill="${color}"
          opacity="${opacity}"
        >${text}</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Create image watermark
   */
  private async createImageWatermark(
    dto: CreateWatermarkDto,
    imageWidth: number,
    imageHeight: number
  ): Promise<Buffer> {
    const wmImageBuffer = (dto as any).wm_image_buffer;
    if (!wmImageBuffer) {
      throw new Error('Watermark image is required');
    }

    const wmImage = sharp(wmImageBuffer);
    const wmMetadata = await wmImage.metadata();

    if (!wmMetadata.width || !wmMetadata.height) {
      throw new Error('Invalid watermark image');
    }

    // Resize if too large (max 20% of image dimensions)
    const maxWmWidth = imageWidth * 0.2;
    const maxWmHeight = imageHeight * 0.2;

    if (wmMetadata.width > maxWmWidth || wmMetadata.height > maxWmHeight) {
      wmImage.resize({
        width: Math.floor(maxWmWidth),
        height: Math.floor(maxWmHeight),
        fit: 'inside',
      });
    }

    // Apply opacity
    const opacity = dto.opacity || 0.18;
    return wmImage
      .ensureAlpha()
      .modulate({ brightness: 1, saturation: 1 })
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      }])
      .png()
      .toBuffer();
  }

  /**
   * Calculate watermark positions based on frequency mode
   */
  private calculatePositions(
    mode: FrequencyMode,
    imageWidth: number,
    imageHeight: number,
    frequency: any
  ): Array<{ top: number; left: number }> {
    switch (mode) {
      case FrequencyMode.SINGLE:
        return this.calculateSinglePosition(imageWidth, imageHeight, frequency.position);

      case FrequencyMode.GRID:
        return this.calculateGridPositions(imageWidth, imageHeight, frequency.spacing_px || 200);

      case FrequencyMode.DIAGONAL_TILE:
        return this.calculateDiagonalPositions(imageWidth, imageHeight, frequency.spacing_px || 280);

      default:
        return [{ top: Math.floor(imageHeight / 2), left: Math.floor(imageWidth / 2) }];
    }
  }

  private calculateSinglePosition(
    width: number,
    height: number,
    position: string = 'center'
  ): Array<{ top: number; left: number }> {
    const positions: Record<string, { top: number; left: number }> = {
      'top-left': { top: 20, left: 20 },
      'top-center': { top: 20, left: Math.floor(width / 2) - 60 },
      'top-right': { top: 20, left: width - 120 },
      'center-left': { top: Math.floor(height / 2) - 30, left: 20 },
      'center': { top: Math.floor(height / 2) - 30, left: Math.floor(width / 2) - 60 },
      'center-right': { top: Math.floor(height / 2) - 30, left: width - 120 },
      'bottom-left': { top: height - 60, left: 20 },
      'bottom-center': { top: height - 60, left: Math.floor(width / 2) - 60 },
      'bottom-right': { top: height - 60, left: width - 120 },
    };
    return [positions[position] || positions.center];
  }

  private calculateGridPositions(
    width: number,
    height: number,
    spacing: number
  ): Array<{ top: number; left: number }> {
    const positions: Array<{ top: number; left: number }> = [];
    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        positions.push({ top: y, left: x });
      }
    }
    return positions;
  }

  private calculateDiagonalPositions(
    width: number,
    height: number,
    spacing: number
  ): Array<{ top: number; left: number }> {
    const positions: Array<{ top: number; left: number }> = [];
    const diagonal = Math.sqrt(width * width + height * height);
    const count = Math.ceil(diagonal / spacing);

    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const x = i * spacing - height;
        const y = j * spacing;
        if (x >= -spacing && x <= width + spacing && y >= -spacing && y <= height + spacing) {
          positions.push({ top: y, left: x });
        }
      }
    }
    return positions;
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .trim();
  }

  private getFontPath(font: string): string {
    const fontMap: Record<string, string> = {
      'NotoSansThai': 'NotoSansThai-Regular.ttf',
      'Roboto': 'Roboto-Regular.ttf',
      'Inter': 'Inter-Regular.ttf',
    };

    const fontFile = fontMap[font] || fontMap.Roboto;
    return join(__dirname, '../assets/fonts', fontFile);
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      'png': 'image/png',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
    };
    return contentTypes[format] || 'image/png';
  }
}

/**
 * Standalone File Upload Service (OOP)
 */
export class StandaloneFileUploadService {
  private readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '6291456');
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  validateFile(buffer: Buffer): void {
    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum (${this.MAX_FILE_SIZE} bytes)`);
    }

    // Basic magic number validation
    const magicNumbers = buffer.slice(0, 8);
    const isValid = this.validateMagicNumbers(magicNumbers);

    if (!isValid) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }
  }

  private validateMagicNumbers(buffer: Buffer): boolean {
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return true;
    }
    return false;
  }
}

/**
 * Standalone Watermark Service (OOP)
 * Orchestrates the watermark process using Dependency Injection pattern
 */
export class StandaloneWatermarkService {
  constructor(
    private readonly imageProcessor: StandaloneImageProcessorService,
    private readonly fileUpload: StandaloneFileUploadService
  ) {}

  async processWatermark(
    imageBuffer: Buffer,
    dto: CreateWatermarkDto
  ): Promise<{ buffer: Buffer; contentType: string }> {
    // Validate file
    this.fileUpload.validateFile(imageBuffer);

    // Type-specific validation
    if (dto.type === WatermarkType.TEXT && !dto.text) {
      throw new Error('Text is required for text watermark');
    }

    if (dto.type === WatermarkType.IMAGE && !(dto as any).wm_image_buffer) {
      throw new Error('Watermark image is required for image watermark');
    }

    // Process watermark
    return this.imageProcessor.processWatermark(imageBuffer, dto);
  }
}
