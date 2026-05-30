import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddAiModelDto {
  @IsString()
  llmFactory: string;

  @IsIn(['chat', 'embedding', 'rerank', 'tts', 'speech2text', 'image2text', 'ocr'])
  modelType: string;

  @IsString()
  modelName: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  apiBase?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokens?: number;
}

export class SetDefaultModelsDto {
  @IsString()
  llmId: string;

  @IsString()
  embeddingId: string;
}
