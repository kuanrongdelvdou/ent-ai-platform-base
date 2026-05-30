import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/logger/app-logger.service';

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined | null>;
  prefix?: '/api/v1' | '/v1';
};

type DownloadResult = {
  buffer: Buffer;
  contentType: string;
  contentDisposition?: string;
};

interface RAGFlowResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

@Injectable()
export class RagflowApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly log = new AppLoggerService('RagflowApi');

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('RAGFLOW_BASE_URL', 'http://localhost:9380').replace(/\/$/, '');
    this.apiKey = this.config.get<string>('RAGFLOW_API_KEY', '');
  }

  private async request<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { method = 'GET', body, params, prefix = '/api/v1' } = options;
    let url = `${this.baseUrl}${prefix}${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          value
            .filter(item => item !== undefined && item !== null && String(item) !== '')
            .forEach(item => searchParams.append(key, String(item)));
          continue;
        }
        searchParams.set(key, String(value));
      }
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    this.log.debug('请求 RAGFlow 接口', { method, path });

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await response.json()) as RAGFlowResponse<T>;
      if (json.code === 0) return { success: true, data: json.data };
      return { success: false, error: json.message || `RAGFlow code ${json.code}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error('RAGFlow 请求失败', error);
      return { success: false, error: message };
    }
  }

  async createDataset(data: {
    name: string;
    description?: string;
    embedding_model?: string;
    parse_type?: number;
    chunk_method?: string;
    pipeline_id?: string;
    parser_config?: Record<string, unknown>;
  }) {
    return this.request<Record<string, unknown>>('/datasets', { method: 'POST', body: data });
  }

  async listDataPipelines<T = Record<string, unknown>>() {
    return this.request<T>('/agents', {
      params: { canvas_category: 'dataflow_canvas', page: 1, page_size: 100 },
    });
  }

  async getDefaultModels<T = Record<string, unknown>>() {
    return this.request<T>('/users/me/models');
  }

  async updateDefaultModels(data: {
    tenant_id: string;
    llm_id: string;
    embd_id: string;
    asr_id: string;
    img2txt_id: string;
  }) {
    return this.request<boolean>('/users/me/models', { method: 'PATCH', body: data });
  }

  async getMyLlms<T = Record<string, unknown>>() {
    return this.request<T>('/llm/my_llms', { prefix: '/v1', params: { include_details: true } });
  }

  async listLlms<T = Record<string, unknown>>(modelType?: string) {
    return this.request<T>('/llm/list', { prefix: '/v1', params: { model_type: modelType } });
  }

  async addModel(data: {
    llm_factory: string;
    model_type: string;
    llm_name: string;
    api_key: string;
    api_base?: string;
    max_tokens?: number;
  }) {
    return this.request<boolean>('/llm/add_llm', { prefix: '/v1', method: 'POST', body: data });
  }

  async updateDataset(datasetId: string, data: Record<string, unknown>) {
    return this.request(`/datasets/${datasetId}`, { method: 'PUT', body: data });
  }

  async deleteDataset(datasetId: string) {
    return this.request('/datasets', { method: 'DELETE', body: { ids: [datasetId] } });
  }

  async listDocuments(
    datasetId: string,
    params: {
      page?: number;
      page_size?: number;
      keywords?: string;
      run?: string[];
      suffix?: string[];
      type?: string;
    },
  ) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/documents`, { params });
  }

  async ingestDocuments(data: {
    doc_ids: string[];
    run: 1 | 2;
    delete?: boolean;
    apply_kb?: boolean;
  }) {
    return this.request<boolean>('/documents/ingest', {
      method: 'POST',
      body: data,
    });
  }

  async uploadDocuments(
    datasetId: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
  ) {
    const url = `${this.baseUrl}/api/v1/datasets/${datasetId}/documents`;
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(
        'file',
        new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
        file.originalname,
      );
    });

    const headers: Record<string, string> = {};
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    this.log.info('上传文档到 RAGFlow', {
      datasetId,
      fileCount: files.length,
      filenames: files.map((item) => item.originalname),
    });

    try {
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      const json = (await response.json()) as RAGFlowResponse;
      if (json.code === 0) return { success: true, data: json.data };
      return { success: false, error: json.message || `RAGFlow code ${json.code}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error('RAGFlow 文档上传失败', error);
      return { success: false, error: message };
    }
  }

  async uploadDocument(datasetId: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    return this.uploadDocuments(datasetId, [file]);
  }

  async createEmptyDocument(datasetId: string, name: string) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/documents`, {
      method: 'POST',
      params: { type: 'empty' },
      body: { name },
    });
  }

  async deleteDocuments(datasetId: string, ids: string[]) {
    return this.request(`/datasets/${datasetId}/documents`, { method: 'DELETE', body: { ids } });
  }

  async parseDocuments(datasetId: string, documentIds: string[]) {
    return this.request(`/datasets/${datasetId}/documents/parse`, {
      method: 'POST',
      body: { document_ids: documentIds },
    });
  }

  async stopParsing(datasetId: string, documentIds: string[]) {
    return this.request(`/datasets/${datasetId}/documents/stop`, {
      method: 'POST',
      body: { document_ids: documentIds },
    });
  }

  async updateDocument(datasetId: string, documentId: string, data: Record<string, unknown>) {
    return this.request(`/datasets/${datasetId}/documents/${documentId}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async batchUpdateDocumentStatus(datasetId: string, docIds: string[], status: 0 | 1) {
    return this.request(`/datasets/${datasetId}/documents/batch-update-status`, {
      method: 'POST',
      body: { doc_ids: docIds, status: String(status) },
    });
  }

  async downloadDocument(documentId: string, ext?: string) {
    const query = ext ? `?ext=${encodeURIComponent(ext)}` : '';
    const url = `${this.baseUrl}/api/v1/documents/${documentId}/download${query}`;
    const headers: Record<string, string> = {};
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    this.log.debug('下载 RAGFlow 文档', { documentId });

    try {
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: text || `HTTP ${response.status}` };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition') || undefined;

      return {
        success: true,
        data: {
          buffer,
          contentType,
          contentDisposition,
        } satisfies DownloadResult,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error('RAGFlow 文档下载失败', error);
      return { success: false, error: message };
    }
  }

  async previewDocument(documentId: string) {
    const url = `${this.baseUrl}/api/v1/documents/${documentId}/preview`;
    const headers: Record<string, string> = {};
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    this.log.debug('预览 RAGFlow 文档', { documentId });

    try {
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: text || `HTTP ${response.status}` };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition') || undefined;

      return {
        success: true,
        data: {
          buffer,
          contentType,
          contentDisposition,
        } satisfies DownloadResult,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error('RAGFlow 文档预览失败', error);
      return { success: false, error: message };
    }
  }

  async search(
    datasetId: string,
    data: {
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
      meta_data_filter?: Record<string, unknown>;
    },
  ) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/search`, {
      method: 'POST',
      body: {
        question: data.question.trim(),
        doc_ids: data.doc_ids ?? [],
        page: data.page ?? 1,
        size: data.size ?? 30,
        top_k: data.top_k ?? 1024,
        similarity_threshold: data.similarity_threshold ?? 0,
        vector_similarity_weight: data.vector_similarity_weight ?? 0.3,
        use_kg: data.use_kg ?? false,
        cross_languages: data.cross_languages ?? [],
        keyword: data.keyword ?? false,
        search_id: data.search_id ?? null,
        rerank_id: data.rerank_id ?? null,
        tenant_rerank_id: data.tenant_rerank_id ?? null,
        meta_data_filter: data.meta_data_filter ?? null,
      },
    });
  }

  async getIngestionSummary(datasetId: string) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/ingestions/summary`);
  }

  async getIngestionLogs(
    datasetId: string,
    params: {
      page?: number;
      page_size?: number;
      orderby?: string;
      desc?: boolean;
      operation_status?: string[];
      create_date_from?: string;
      create_date_to?: string;
      log_type?: 'dataset' | 'file';
      keywords?: string;
    },
  ) {
    const nextParams: Record<string, string | number | boolean | string[] | undefined> = {
      page: params.page,
      page_size: params.page_size,
      orderby: params.orderby,
      desc: params.desc,
      create_date_from: params.create_date_from,
      create_date_to: params.create_date_to,
      log_type: params.log_type,
      keywords: params.keywords,
      operation_status: params.operation_status,
    };
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/ingestions`, {
      params: nextParams,
    });
  }

  async getIngestionLog(datasetId: string, logId: string) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/ingestions/${logId}`);
  }
}
