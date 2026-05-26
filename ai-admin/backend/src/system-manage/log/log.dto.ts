import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OperationLogSearchDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) current?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) size?: number;
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() module?: string;
}

export class LoginLogSearchDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) current?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) size?: number;
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() status?: string;
}
