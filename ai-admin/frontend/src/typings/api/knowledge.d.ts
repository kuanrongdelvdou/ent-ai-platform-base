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
      suffix?: string;
      nickname?: string;
      chunkNum?: number;
      tokenNum?: number;
      progress?: number;
      progressMsg?: string;
      processBeginAt?: string;
      processDuration?: number;
      createDate?: string;
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
      run?: string[];
      suffix?: string[];
      metadata?: Record<string, string[]>;
      return_empty_metadata?: boolean;
    }>;

    type DocumentList = Common.PaginatingQueryRecord<Document>;

    type DocumentFilters = {
      total?: number;
      filter?: {
        run_status?: Record<string, number>;
        suffix?: Record<string, number>;
        metadata?: Record<string, Record<string, number>>;
      };
    };

    type SearchResult = {
      id?: string;
      documentId?: string;
      documentName?: string;
      content?: string;
      similarity?: number;
      score?: number;
      [key: string]: any;
    };

    type SearchForm = {
      question: string;
      doc_ids?: string[];
      page?: number;
      size?: number;
      top_k?: number;
      similarity_threshold?: number;
      vector_similarity_weight?: number;
      use_kg?: boolean;
      cross_languages?: string[];
      keyword?: boolean;
      search_id?: string;
      rerank_id?: string;
      tenant_rerank_id?: number;
      meta_data_filter?: Record<string, any> | null;
    };

    type IngestionSummary = {
      doc_num?: number;
      chunk_num?: number;
      token_num?: number;
      status?: Record<string, any>;
    };

    type IngestionLogStatus = 'UNSTART' | 'RUNNING' | 'CANCEL' | 'DONE' | 'FAIL' | 'SCHEDULE' | string;

    type IngestionLogItem = {
      id: string;
      dataset_id?: string;
      document_id?: string;
      document_name?: string;
      pipeline_id?: string;
      pipeline_title?: string;
      operation_status?: IngestionLogStatus;
      task_type?: string;
      source_from?: string;
      operation_content?: string;
      process_duation?: number;
      process_duration?: number;
      process_begin_at?: string;
      process_end_at?: string;
      create_time?: string;
      [key: string]: any;
    };

    type IngestionLogsParams = {
      page?: number;
      page_size?: number;
      orderby?: string;
      desc?: boolean;
      operation_status?: string[];
      create_date_from?: string;
      create_date_to?: string;
      log_type?: 'dataset' | 'file';
      keywords?: string;
    };

    type IngestionLogsResult = {
      total: number;
      logs: IngestionLogItem[];
    };
  }
}
