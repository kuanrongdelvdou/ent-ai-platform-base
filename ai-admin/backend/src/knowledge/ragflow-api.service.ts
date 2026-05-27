import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/logger/app-logger.service';

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
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
    const { method = 'GET', body, params } = options;
    let url = `${this.baseUrl}/api/v1${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
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
    chunk_method?: string;
    parser_config?: Record<string, unknown>;
  }) {
    return this.request<Record<string, unknown>>('/datasets', { method: 'POST', body: data });
  }

  async updateDataset(datasetId: string, data: Record<string, unknown>) {
    return this.request(`/datasets/${datasetId}`, { method: 'PUT', body: data });
  }

  async deleteDataset(datasetId: string) {
    return this.request('/datasets', { method: 'DELETE', body: { ids: [datasetId] } });
  }

  async listDocuments(
    datasetId: string,
    params: { page?: number; page_size?: number; keywords?: string },
  ) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/documents`, { params });
  }

  async uploadDocument(datasetId: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const url = `${this.baseUrl}/api/v1/datasets/${datasetId}/documents`;
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);

    const headers: Record<string, string> = {};
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    this.log.info('上传文档到 RAGFlow', { datasetId, filename: file.originalname });

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

  async search(
    datasetId: string,
    data: {
      question: string;
      top_k?: number;
      similarity_threshold?: number;
      vector_similarity_weight?: number;
    },
  ) {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/search`, {
      method: 'POST',
      body: {
        question: data.question,
        top_k: data.top_k ?? 10,
        similarity_threshold: data.similarity_threshold ?? 0.2,
        vector_similarity_weight: data.vector_similarity_weight ?? 0.3,
        keyword: false,
      },
    });
  }
}
