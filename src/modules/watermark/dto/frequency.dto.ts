import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FrequencyMode {
  SINGLE = 'single',
  GRID = 'grid',
  DIAGONAL_TILE = 'diagonal_tile',
}

export enum Position {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  CENTER_LEFT = 'center-left',
  CENTER = 'center',
  CENTER_RIGHT = 'center-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right',
}

export class FrequencyDto {
  @IsEnum(FrequencyMode)
  mode!: FrequencyMode;

  @IsOptional()
  @IsEnum(Position)
  position?: Position = Position.BOTTOM_RIGHT;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  margin_px?: number = 24;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(2000)
  spacing_px?: number = 280;
}
