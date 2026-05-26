import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { emptyToUndefined } from '../../common/transforms/empty-to-undefined';

export class RoleSearchDto {
  @Transform(emptyToUndefined) @IsOptional() @IsString() roleName?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() roleCode?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() current?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() size?: number = 10;
}

export class CreateRoleDto {
  @IsString() roleName: string;
  @IsString() roleCode: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() roleDesc?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) status?: string;
}

export class UpdateRoleDto {
  @Transform(emptyToUndefined) @IsOptional() @IsString() roleName?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() roleDesc?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) status?: string;
  @IsOptional() menuIds?: string[];
}
