declare namespace Api {
  namespace Knowledge {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    type KnowledgeBase = Common.CommonRecord<{
      name: string;
      description: string | null;
      datasetId: string;
      deptId?: string | null;
      ownerId?: string | null;
      visibility?: string | null;
      embeddingModelId?: string | null;
      parseType?: number | null;
      chunkMethod: string;
      pipelineId?: string | null;
      parserConfig: Record<string, any> | null;
      roleIds: string[];
      roles?: Api.SystemManage.AllRole[];
    }>;

    type KnowledgeBaseSearchParams = CommonType.RecordNullable<
      Pick<KnowledgeBase, 'name' | 'status' | 'deptId'> & CommonSearchParams
    >;

    type KnowledgeBaseList = Common.PaginatingQueryRecord<KnowledgeBase>;

    type AiReadinessStatus = 'NOT_CONFIGURED' | 'PARTIAL' | 'READY' | 'ERROR';

    type AiReadiness = {
      status: AiReadinessStatus;
      defaultModels: {
        llm: { id: string; name: string } | null;
        embedding: { id: string; name: string } | null;
        rerank: { id: string; name: string } | null;
      };
      missing: string[];
      canInitialize: boolean;
      tenantId?: string;
      message?: string;
    };

    type AiModelType = 'chat' | 'embedding' | 'rerank' | 'tts' | 'speech2text' | 'image2text' | 'ocr';

    type AiAvailableModel = {
      id?: string | number | null;
      fid: string;
      llm_name: string;
      model_type: AiModelType;
      available?: boolean;
      status?: string;
      max_tokens?: number;
      used_token?: number;
    };

    type AiAddedModel = {
      id?: string | number;
      name: string;
      type: AiModelType;
      used_token?: number;
      status?: string;
      api_base?: string;
      max_tokens?: number;
      is_tools?: boolean;
    };

    type AiModelConfig = {
      readiness: AiReadiness;
      myModels: Record<string, { tags?: string | string[] | null; llm: AiAddedModel[] }>;
      availableModels: Record<string, AiAvailableModel[]>;
      errors?: {
        myModels?: string;
        availableModels?: string;
      };
    };

    type AddAiModelForm = {
      llmFactory: string;
      modelType: AiModelType;
      modelName: string;
      apiKey: string;
      apiBase?: string;
      maxTokens?: number | null;
    };

    type SetDefaultModelsForm = {
      llmId: string;
      embeddingId: string;
    };

    type DataPipeline = {
      id: string;
      name: string;
    };

    type KnowledgeBaseForm = {
      name: string;
      description: string | null;
      embeddingModel: string;
      parseType: number;
      chunkMethod?: string | null;
      pipelineId?: string | null;
      parserConfig?: Record<string, any> | null;
      status: Api.Common.EnableStatus | null;
      roleIds: string[];
      deptId?: string | null;
      visibility?: string | null;
    };

    type Document = {
      id: string;
      name: string;
      datasetId?: string;
      type?: string;
      size?: number;
      chunkNum?: number;
      tokenNum?: number;
      progress?: number;
      run?: string;
      status?: string;
      chunkMethod?: string | null;
      parseMethod?: string | null;
      pipelineId?: string | null;
      pipelineName?: string | null;
      parserConfig?: Record<string, any> | null;
      metaFields?: Record<string, any> | null;
      createTime?: string;
      updateTime?: string;
    };

    type DocumentListParams = CommonType.RecordNullable<{
      current: number;
      size: number;
      keywords?: string;
    }>;

    type DocumentList = Common.PaginatingQueryRecord<Document>;

    type SearchResult = {
      id?: string;
      documentId?: string;
      documentName?: string;
      content?: string;
      similarity?: number;
      score?: number;
      [key: string]: any;
    };
  }
}
