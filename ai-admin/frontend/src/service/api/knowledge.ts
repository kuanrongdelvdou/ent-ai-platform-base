import { request } from '../request';

export function fetchGetKnowledgeBaseList(params?: Api.Knowledge.KnowledgeBaseSearchParams) {
  return request<Api.Knowledge.KnowledgeBaseList>({ url: '/knowledge/getKnowledgeBaseList', method: 'get', params });
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

export function fetchSearchKnowledgeBase(kbId: string, data: { question: string; page?: number; pageSize?: number }) {
  return request<Api.Knowledge.SearchResult[]>({
    url: `/knowledge/search/${kbId}`,
    method: 'post',
    data
  });
}
