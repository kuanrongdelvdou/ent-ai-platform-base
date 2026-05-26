import { IsString, IsOptional } from 'class-validator';

export class CreateConfigDto {
  @IsString() key: string;
  @IsString() value: string;
  @IsOptional() @IsString() remark?: string;
}

export class UpdateConfigDto {
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsString() remark?: string;
}
