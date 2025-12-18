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
  TOP_LEFT = 'top_left',
  TOP_RIGHT = 'top_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_RIGHT = 'bottom_right',
  CENTER = 'center',
}

export class FrequencyDto {
  @IsEnum(FrequencyMode)
  mode: FrequencyMode;

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
