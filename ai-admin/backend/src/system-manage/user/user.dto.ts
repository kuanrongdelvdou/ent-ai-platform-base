import { IsString, IsOptional, IsInt, IsEmail, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { emptyToUndefined } from '../../common/transforms/empty-to-undefined';

export class UserSearchDto {
  @Transform(emptyToUndefined) @IsOptional() @IsString() userName?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() nickName?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() userPhone?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() userEmail?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) userGender?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() current?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() size?: number = 10;
}

export class CreateUserDto {
  @IsString() userName: string;
  @IsString() password: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() nickName?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) userGender?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() userPhone?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsEmail() userEmail?: string;
  @IsOptional() userRoles?: string[];
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) status?: string;
}

export class UpdateUserDto {
  @Transform(emptyToUndefined) @IsOptional() @IsString() nickName?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) userGender?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsString() userPhone?: string;
  @Transform(emptyToUndefined) @IsOptional() @IsEmail() userEmail?: string;
  @IsOptional() userRoles?: string[];
  @Transform(emptyToUndefined) @IsOptional() @IsIn(['1', '2']) status?: string;
}
