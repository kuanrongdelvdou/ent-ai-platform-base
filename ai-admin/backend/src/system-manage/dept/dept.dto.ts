import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeptDto {
  @IsOptional() @IsString() parentId?: string;
  @IsString() name: string;
  @IsOptional() @IsInt() @Min(0) sort?: number;
  @IsOptional() @IsString() leaderId?: string;
  @IsOptional() @IsString() status?: string;
}

export class UpdateDeptDto {
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(0) sort?: number;
  @IsOptional() @IsString() leaderId?: string;
  @IsOptional() @IsString() status?: string;
}
