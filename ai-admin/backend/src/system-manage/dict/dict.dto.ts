import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDictTypeDto {
  @IsString() name: string;
  @IsString() code: string;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() status?: string;
}

export class UpdateDictTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() status?: string;
}

export class CreateDictItemDto {
  @IsString() dictTypeId: string;
  @IsString() label: string;
  @IsString() value: string;
  @IsOptional() @IsInt() @Min(0) sort?: number;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() status?: string;
}

export class UpdateDictItemDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsInt() @Min(0) sort?: number;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @IsString() status?: string;
}
