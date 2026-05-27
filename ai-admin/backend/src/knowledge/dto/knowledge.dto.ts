import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}

export class KnowledgeBaseListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  current?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number = 10;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class DocumentListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_size?: number = 10;

  @IsOptional()
  @IsString()
  keywords?: string;
}

export class ParseDocumentDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class DeleteDocumentDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class SearchDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  top_k?: number = 10;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  similarity_threshold?: number = 0.2;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vector_similarity_weight?: number = 0.3;
}
