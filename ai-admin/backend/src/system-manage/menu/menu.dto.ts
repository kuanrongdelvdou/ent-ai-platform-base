import { IsString, IsOptional, IsInt, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDto {
  @IsOptional() @IsString() parentId?: string;
  @IsIn(['1', '2']) menuType: string;
  @IsString() menuName: string;
  @IsString() routeName: string;
  @IsString() routePath: string;
  @IsOptional() @IsString() component?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsIn(['1', '2']) iconType?: string;
  @IsOptional() @Type(() => Number) @IsInt() order?: number;
  @IsOptional() @IsIn(['1', '2']) status?: string;
  @IsOptional() buttons?: { code: string; desc: string }[];
  @IsOptional() keepAlive?: boolean;
  @IsOptional() hideInMenu?: boolean;
  @IsOptional() @IsString() i18nKey?: string;
}

export class UpdateMenuDto extends CreateMenuDto {}
