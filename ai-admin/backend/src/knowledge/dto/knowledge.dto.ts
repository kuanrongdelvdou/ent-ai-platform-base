import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  embeddingModel?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsIn([1, 2])
  parseType?: number;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsString()
  deptId?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

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
  embeddingModel?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsIn([1, 2])
  parseType?: number;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsString()
  deptId?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

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

  @IsOptional()
  @IsString()
  deptId?: string;
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

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  run?: string[];

  @IsOptional()
  @Transform(({ value, obj }) => {
    const source = value ?? obj?.run;
    if (source === undefined || source === null || source === '') return undefined;
    if (Array.isArray(source)) return source;
    return String(source)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  run_status?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  suffix?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return value;
      }
    }
    return undefined;
  })
  @IsObject()
  metadata?: Record<string, string[]>;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  return_empty_metadata?: boolean;
}

export class DocumentFilterDto {
  @IsOptional()
  @IsString()
  keywords?: string;
}

export class ParseDocumentDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  run?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  delete?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  applyKb?: boolean;
}

export class DeleteDocumentDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class CreateEmptyDocumentDto {
  @IsString()
  name: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;
}

export class UpdateDocumentStatusDto {
  @IsArray()
  @IsString({ each: true })
  docIds: string[];

  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status: number;
}

export class SearchDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  doc_ids?: string[] = [];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number = 30;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  top_k?: number = 1024;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  similarity_threshold?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vector_similarity_weight?: number = 0.3;

  @IsOptional()
  @IsBoolean()
  use_kg?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cross_languages?: string[] = [];

  @IsOptional()
  @IsBoolean()
  keyword?: boolean = false;

  @IsOptional()
  @IsString()
  search_id?: string;

  @IsOptional()
  @IsString()
  rerank_id?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tenant_rerank_id?: number;

  @IsOptional()
  @IsObject()
  meta_data_filter?: Record<string, unknown>;
}

export class IngestionLogsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_size?: number = 20;

  @IsOptional()
  @IsString()
  orderby?: string = 'create_time';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() !== 'false';
  })
  @IsBoolean()
  desc?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return [];
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  operation_status?: string[] = [];

  @IsOptional()
  @IsString()
  create_date_from?: string;

  @IsOptional()
  @IsString()
  create_date_to?: string;

  @IsOptional()
  @IsIn(['dataset', 'file'])
  log_type?: 'dataset' | 'file' = 'file';

  @IsOptional()
  @IsString()
  keywords?: string;
}

export class MetadataSummaryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  docIds?: string[];
}

export class MetadataSelectorDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  document_ids?: string[];

  @IsOptional()
  @IsObject()
  metadata_condition?: Record<string, unknown>;
}

export class MetadataUpdateOpDto {
  @IsString()
  key: string;

  @IsOptional()
  value?: unknown;

  @IsOptional()
  @IsString()
  match?: string;

  @IsOptional()
  @IsString()
  valueType?: string;
}

export class MetadataDeleteOpDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  value?: string;
}

export class UpdateDocumentsMetadataDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataSelectorDto)
  selector?: MetadataSelectorDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetadataUpdateOpDto)
  updates?: MetadataUpdateOpDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetadataDeleteOpDto)
  deletes?: MetadataDeleteOpDto[];
}

const metadataFieldTypes = ['string', 'list', 'time', 'number'] as const;

export class AutoMetadataFieldDto {
  @IsString()
  key: string;

  @IsIn(metadataFieldTypes)
  type: (typeof metadataFieldTypes)[number];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enum?: string[];
}

export class UpdateMetadataConfigDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoMetadataFieldDto)
  metadata?: AutoMetadataFieldDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoMetadataFieldDto)
  builtInMetadata?: AutoMetadataFieldDto[];
}
