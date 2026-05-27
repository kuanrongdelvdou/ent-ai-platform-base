import { RagflowApiService } from './ragflow-api.service';

describe('RagflowApiService', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('http://ragflow.local'),
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'RAGFLOW_BASE_URL') return 'http://ragflow.local';
      if (key === 'RAGFLOW_API_KEY') return 'test-token';
      return defaultValue;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends Bearer token and document_ids when parsing documents', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ code: 0, data: { success_count: 1 } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new RagflowApiService(config as any);
    const result = await service.parseDocuments('dataset-1', ['doc-1']);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://ragflow.local/api/v1/datasets/dataset-1/documents/parse',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        body: JSON.stringify({ document_ids: ['doc-1'] }),
      }),
    );
  });
});
