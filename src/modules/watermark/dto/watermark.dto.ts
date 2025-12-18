import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FrequencyDto } from './frequency.dto';

export enum WatermarkType {
  TEXT = 'text',
  IMAGE = 'image',
}

export enum OutputFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
}

export class CreateWatermarkDto {
  @IsEnum(WatermarkType)
  type: WatermarkType;

  @ValidateNested()
  @Type(() => FrequencyDto)
  frequency: FrequencyDto;

  // Text watermark fields
  @ValidateIf((o) => o.type === WatermarkType.TEXT)
  @IsString()
  @MaxLength(200)
  text?: string;

  @ValidateIf((o) => o.type === WatermarkType.TEXT)
  @IsString()
  font?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(900)
  font_weight?: number = 400;

  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(512)
  font_size?: number = 32;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #FFFFFF)',
  })
  color?: string = '#FFFFFF';

  // Image watermark fields
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(5)
  wm_scale?: number = 0.2;

  // Common styling
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  opacity?: number = 0.18;

  @IsOptional()
  @IsInt()
  @Min(-180)
  @Max(180)
  angle_deg?: number = -30;

  @IsOptional()
  @IsEnum(OutputFormat)
  output_format?: OutputFormat = OutputFormat.PNG;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number = 90;
}
