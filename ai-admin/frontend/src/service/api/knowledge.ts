import { request } from '../request';
import { getAuthorization } from '../request/shared';
import { getServiceBaseURL } from '@/utils/service';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export function fetchGetKnowledgeBaseList(params?: Api.Knowledge.KnowledgeBaseSearchParams) {
  return request<Api.Knowledge.KnowledgeBaseList>({ url: '/knowledge/getKnowledgeBaseList', method: 'get', params });
}

export function fetchGetAiHubReadiness() {
  return request<Api.Knowledge.AiReadiness>({ url: '/ai-hub/getReadiness', method: 'get' });
}

export function fetchGetAiHubModelConfig() {
  return request<Api.Knowledge.AiModelConfig>({ url: '/ai-hub/getModelConfig', method: 'get' });
}

export function fetchAddAiModel(data: Api.Knowledge.AddAiModelForm) {
  return request<true>({ url: '/ai-hub/addModel', method: 'post', data });
}

export function fetchSetDefaultAiModels(data: Api.Knowledge.SetDefaultModelsForm) {
  return request<true>({ url: '/ai-hub/setDefaultModels', method: 'patch', data });
}

export function fetchGetDataPipelines() {
  return request<Api.Knowledge.DataPipeline[]>({ url: '/knowledge/getDataPipelines', method: 'get' });
}

export function fetchCreateKnowledgeBase(data: Api.Knowledge.KnowledgeBaseForm) {
  return request<null>({ url: '/knowledge/createKnowledgeBase', method: 'post', data });
}

export function fetchUpdateKnowledgeBase(id: string, data: Partial<Api.Knowledge.KnowledgeBaseForm>) {
  return request<null>({ url: `/knowledge/updateKnowledgeBase/${id}`, method: 'put', data });
}

export function fetchDeleteKnowledgeBase(id: string) {
  return request<null>({ url: `/knowledge/deleteKnowledgeBase/${id}`, method: 'delete' });
}

export function fetchGetDocumentList(kbId: string, params?: Api.Knowledge.DocumentListParams) {
  return request<Api.Knowledge.DocumentList>({
    url: `/knowledge/getDocumentList/${kbId}`,
    method: 'get',
    params: {
      page: params?.current,
      page_size: params?.size,
      keywords: params?.keywords
    }
  });
}

export function fetchUploadDocument(kbId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<null>({
    url: `/knowledge/uploadDocument/${kbId}`,
    method: 'post',
    data: formData
  });
}

export function fetchDeleteDocuments(kbId: string, documentIds: string[]) {
  return request<null>({
    url: `/knowledge/deleteDocuments/${kbId}`,
    method: 'delete',
    data: { ids: documentIds }
  });
}

export function fetchParseDocuments(kbId: string, documentIds: string[]) {
  return request<null>({
    url: `/knowledge/parseDocuments/${kbId}`,
    method: 'post',
    data: { ids: documentIds }
  });
}

export function fetchStopParsing(kbId: string, documentIds: string[]) {
  return request<null>({
    url: `/knowledge/stopParsing/${kbId}`,
    method: 'post',
    data: { ids: documentIds }
  });
}

export function fetchUpdateDocument(
  kbId: string,
  docId: string,
  data: { name?: string; chunkMethod?: string; pipelineId?: string; parserConfig?: Record<string, unknown> }
) {
  return request<null>({
    url: `/knowledge/updateDocument/${kbId}/${docId}`,
    method: 'put',
    data
  });
}

export function fetchUpdateDocumentStatus(kbId: string, docIds: string[], status: 0 | 1) {
  return request<null>({
    url: `/knowledge/updateDocumentStatus/${kbId}`,
    method: 'post',
    data: { docIds, status }
  });
}

export async function fetchDownloadDocument(kbId: string, docId: string, ext?: string) {
  const search = new URLSearchParams();
  if (ext) search.set('ext', ext);
  const url = `${baseURL}/knowledge/downloadDocument/${kbId}/${docId}${search.toString() ? `?${search.toString()}` : ''}`;

  const authorization = getAuthorization();
  const response = await fetch(url, {
    method: 'GET',
    headers: authorization ? { Authorization: authorization } : undefined
  });

  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i);
  const filename = filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1]) : undefined;

  return { blob, filename };
}

export function fetchSearchKnowledgeBase(kbId: string, data: { question: string; page?: number; pageSize?: number }) {
  return request<Api.Knowledge.SearchResult[]>({
    url: `/knowledge/search/${kbId}`,
    method: 'post',
    data
  });
}
