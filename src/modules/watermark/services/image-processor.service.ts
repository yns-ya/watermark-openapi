import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as path from 'path';
import { CreateWatermarkDto, WatermarkType } from '../dto/watermark.dto';
import { FrequencyDto, FrequencyMode } from '../dto/frequency.dto';

export interface WatermarkPosition {
  x: number;
  y: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  private readonly fontsPath: string;
  private readonly fontMap: Map<string, string>;

  constructor(private configService: ConfigService) {
    this.fontsPath = this.configService.get<string>('watermark.fontsPath');
    this.fontMap = this.initializeFontMap();
  }

  private initializeFontMap(): Map<string, string> {
    const fontMap = new Map<string, string>();
    const availableFonts =
      this.configService.get<string[]>('watermark.availableFonts') || [];

    availableFonts.forEach((fontName) => {
      fontMap.set(fontName, path.join(this.fontsPath, `${fontName}-Regular.ttf`));
    });

    return fontMap;
  }

  /**
   * Process watermark on image
   */
  async processWatermark(
    imageBuffer: Buffer,
    watermarkImageBuffer: Buffer | null,
    dto: CreateWatermarkDto,
  ): Promise<Buffer> {
    try {
      let processedImage = sharp(imageBuffer);
      const metadata = await processedImage.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }

      // Validate image dimensions
      this.validateImageDimensions(metadata.width, metadata.height);

      // Create watermark
      const watermark = await this.createWatermark(
        dto,
        metadata.width,
        metadata.height,
        watermarkImageBuffer,
      );

      // Calculate positions
      const positions = this.calculatePositions(
        dto.frequency,
        metadata.width,
        metadata.height,
      );

      // Apply watermarks
      const composites = positions.map((pos) => ({
        input: watermark,
        left: Math.round(pos.x),
        top: Math.round(pos.y),
        blend: 'over' as const,
      }));

      processedImage = processedImage.composite(composites);

      // Output format
      return this.formatOutput(processedImage, dto);
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create watermark (text or image)
   */
  private async createWatermark(
    dto: CreateWatermarkDto,
    targetWidth: number,
    targetHeight: number,
    watermarkImageBuffer: Buffer | null,
  ): Promise<Buffer> {
    if (dto.type === WatermarkType.IMAGE && watermarkImageBuffer) {
      return this.createImageWatermark(
        watermarkImageBuffer,
        targetWidth,
        targetHeight,
        dto.wm_scale,
        dto.opacity,
      );
    } else if (dto.type === WatermarkType.TEXT && dto.text && dto.font) {
      return this.createTextWatermark(
        dto.text,
        dto.font,
        dto.font_size,
        dto.color,
        dto.opacity,
        dto.angle_deg,
      );
    }

    throw new Error('Invalid watermark configuration');
  }

  /**
   * Create image watermark
   */
  private async createImageWatermark(
    watermarkBuffer: Buffer,
    targetWidth: number,
    targetHeight: number,
    scale: number,
    opacity: number,
  ): Promise<Buffer> {
    const shortSide = Math.min(targetWidth, targetHeight);
    const wmSize = Math.round(shortSide * scale);

    // Resize watermark
    let watermark = sharp(watermarkBuffer).resize(wmSize, wmSize, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Apply opacity
    if (opacity < 1) {
      const alpha = Math.round(opacity * 255);
      watermark = watermark.composite([
        {
          input: Buffer.from([255, 255, 255, alpha]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in',
        },
      ]);
    }

    return watermark.png().toBuffer();
  }

  /**
   * Create text watermark as SVG
   */
  private async createTextWatermark(
    text: string,
    fontName: string,
    fontSize: number,
    color: string,
    opacity: number,
    angle: number,
  ): Promise<Buffer> {
    // Sanitize text to prevent SVG injection
    const sanitizedText = this.sanitizeText(text);

    const fontFamily = this.fontMap.has(fontName) ? fontName : 'Roboto';

    // Calculate SVG dimensions based on text length and font size
    const width = Math.max(text.length * fontSize * 0.6, 200);
    const height = Math.max(fontSize * 2, 100);

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text
          x="${width / 2}"
          y="${height / 2}"
          font-family="${fontFamily}"
          font-size="${fontSize}"
          fill="${color}"
          opacity="${opacity}"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${angle} ${width / 2} ${height / 2})"
        >${sanitizedText}</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Calculate watermark positions based on frequency mode
   */
  private calculatePositions(
    frequency: FrequencyDto,
    width: number,
    height: number,
  ): WatermarkPosition[] {
    switch (frequency.mode) {
      case FrequencyMode.SINGLE:
        return [this.calculateSinglePosition(frequency, width, height)];

      case FrequencyMode.GRID:
        return this.calculateGridPositions(frequency.spacing_px, width, height);

      case FrequencyMode.DIAGONAL_TILE:
        return this.calculateDiagonalPositions(frequency.spacing_px, width, height);

      default:
        return [{ x: width - 100, y: height - 100 }];
    }
  }

  /**
   * Calculate single position
   */
  private calculateSinglePosition(
    frequency: FrequencyDto,
    width: number,
    height: number,
  ): WatermarkPosition {
    const margin = frequency.margin_px || 24;
    const position = frequency.position || 'bottom_right';

    const positions: Record<string, WatermarkPosition> = {
      top_left: { x: margin, y: margin },
      top_right: { x: width - margin, y: margin },
      bottom_left: { x: margin, y: height - margin },
      bottom_right: { x: width - margin, y: height - margin },
      center: { x: width / 2, y: height / 2 },
    };

    return positions[position] || positions.bottom_right;
  }

  /**
   * Calculate grid positions
   */
  private calculateGridPositions(
    spacing: number,
    width: number,
    height: number,
  ): WatermarkPosition[] {
    const positions: WatermarkPosition[] = [];

    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  /**
   * Calculate diagonal positions
   */
  private calculateDiagonalPositions(
    spacing: number,
    width: number,
    height: number,
  ): WatermarkPosition[] {
    const positions: WatermarkPosition[] = [];
    const offset = spacing / 2;

    for (let y = -spacing; y < height + spacing; y += spacing) {
      for (let x = -spacing; x < width + spacing; x += spacing) {
        positions.push({
          x: x + (Math.floor(y / spacing) % 2 === 0 ? 0 : offset),
          y,
        });
      }
    }

    return positions;
  }

  /**
   * Format output based on requested format
   */
  private async formatOutput(
    image: sharp.Sharp,
    dto: CreateWatermarkDto,
  ): Promise<Buffer> {
    switch (dto.output_format) {
      case 'jpeg':
        return image.jpeg({ quality: dto.quality }).toBuffer();

      case 'webp':
        return image.webp({ quality: dto.quality }).toBuffer();

      case 'png':
      default:
        return image.png().toBuffer();
    }
  }

  /**
   * Validate image dimensions
   */
  private validateImageDimensions(width: number, height: number): void {
    const maxWidth = this.configService.get<number>('upload.maxImageWidth');
    const maxHeight = this.configService.get<number>('upload.maxImageHeight');

    if (width > maxWidth || height > maxHeight) {
      throw new Error(
        `Image dimensions exceed maximum allowed (${maxWidth}x${maxHeight})`,
      );
    }
  }

  /**
   * Sanitize text to prevent injection
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
