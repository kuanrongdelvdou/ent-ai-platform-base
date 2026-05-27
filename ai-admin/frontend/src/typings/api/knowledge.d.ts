declare namespace Api {
  namespace Knowledge {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    type KnowledgeBase = Common.CommonRecord<{
      name: string;
      description: string | null;
      datasetId: string;
      chunkMethod: string;
      parserConfig: Record<string, any> | null;
      roleIds: string[];
      roles?: Api.SystemManage.AllRole[];
    }>;

    type KnowledgeBaseSearchParams = CommonType.RecordNullable<
      Pick<KnowledgeBase, 'name' | 'status'> & CommonSearchParams
    >;

    type KnowledgeBaseList = Common.PaginatingQueryRecord<KnowledgeBase>;

    type KnowledgeBaseForm = {
      name: string;
      description: string | null;
      chunkMethod: string;
      parserConfig?: Record<string, any> | null;
      status: Api.Common.EnableStatus | null;
      roleIds: string[];
    };

    type Document = {
      id: string;
      name: string;
      size?: number;
      chunkNum?: number;
      tokenNum?: number;
      progress?: number;
      run?: string;
      status?: string;
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
