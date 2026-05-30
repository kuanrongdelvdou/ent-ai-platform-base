import { AiHubService } from './ai-hub.service';

describe('AiHubService', () => {
  it('returns READY when RAGFlow has default LLM and embedding models', async () => {
    const ragflow = {
      getDefaultModels: jest.fn().mockResolvedValue({
        success: true,
        data: {
          tenant_id: 'tenant-1',
          llm_id: 'qwen2.5',
          embd_id: 'bge-large-zh',
        },
      }),
    };
    const service = new AiHubService(ragflow as any);

    await expect(service.getReadiness()).resolves.toEqual(
      expect.objectContaining({
        status: 'READY',
        missing: [],
        defaultModels: expect.objectContaining({
          llm: expect.objectContaining({ id: 'qwen2.5' }),
          embedding: expect.objectContaining({ id: 'bge-large-zh' }),
        }),
      }),
    );
  });

  it('returns PARTIAL when only one required default model is configured', async () => {
    const ragflow = {
      getDefaultModels: jest.fn().mockResolvedValue({
        success: true,
        data: {
          tenant_id: 'tenant-1',
          llm_id: 'qwen2.5',
          embd_id: '',
        },
      }),
    };
    const service = new AiHubService(ragflow as any);

    await expect(service.getReadiness()).resolves.toEqual(
      expect.objectContaining({
        status: 'PARTIAL',
        missing: ['embedding'],
      }),
    );
  });

  it('loads model config from RAGFlow defaults and model lists', async () => {
    const ragflow = {
      getDefaultModels: jest.fn().mockResolvedValue({
        success: true,
        data: {
          tenant_id: 'tenant-1',
          llm_id: 'qwen2.5@OpenAI-API-Compatible',
          embd_id: 'bge-large-zh@OpenAI-API-Compatible',
        },
      }),
      getMyLlms: jest.fn().mockResolvedValue({
        success: true,
        data: {
          'OpenAI-API-Compatible': {
            tags: 'LLM,Embedding',
            llm: [{ name: 'qwen2.5', type: 'chat', status: '1' }],
          },
        },
      }),
      listLlms: jest.fn().mockResolvedValue({
        success: true,
        data: {
          'OpenAI-API-Compatible': [
            { llm_name: 'qwen2.5', fid: 'OpenAI-API-Compatible', model_type: 'chat', available: true },
            { llm_name: 'bge-large-zh', fid: 'OpenAI-API-Compatible', model_type: 'embedding', available: true },
          ],
        },
      }),
    };
    const service = new AiHubService(ragflow as any);

    await expect(service.getModelConfig()).resolves.toEqual(
      expect.objectContaining({
        readiness: expect.objectContaining({ status: 'READY' }),
        myModels: expect.objectContaining({ 'OpenAI-API-Compatible': expect.any(Object) }),
        availableModels: expect.objectContaining({ 'OpenAI-API-Compatible': expect.any(Array) }),
      }),
    );
  });

  it('preserves existing tenant model fields when setting default LLM and embedding', async () => {
    const ragflow = {
      getDefaultModels: jest.fn().mockResolvedValue({
        success: true,
        data: {
          tenant_id: 'tenant-1',
          llm_id: 'old-chat@OpenAI',
          embd_id: 'old-embedding@OpenAI',
          asr_id: 'asr@OpenAI',
          img2txt_id: 'vlm@OpenAI',
        },
      }),
      updateDefaultModels: jest.fn().mockResolvedValue({ success: true, data: true }),
    };
    const service = new AiHubService(ragflow as any);

    await service.setDefaultModels({
      llmId: 'new-chat@OpenAI-API-Compatible',
      embeddingId: 'new-embedding@OpenAI-API-Compatible',
    });

    expect(ragflow.updateDefaultModels).toHaveBeenCalledWith({
      tenant_id: 'tenant-1',
      llm_id: 'new-chat@OpenAI-API-Compatible',
      embd_id: 'new-embedding@OpenAI-API-Compatible',
      asr_id: 'asr@OpenAI',
      img2txt_id: 'vlm@OpenAI',
    });
  });

  it('adds a provider model through RAGFlow', async () => {
    const ragflow = {
      addModel: jest.fn().mockResolvedValue({ success: true, data: true }),
    };
    const service = new AiHubService(ragflow as any);

    await service.addModel({
      llmFactory: 'OpenAI-API-Compatible',
      modelType: 'chat',
      modelName: 'qwen2.5',
      apiKey: 'secret',
      apiBase: 'https://api.example.com/v1',
    });

    expect(ragflow.addModel).toHaveBeenCalledWith({
      llm_factory: 'OpenAI-API-Compatible',
      model_type: 'chat',
      llm_name: 'qwen2.5',
      api_key: 'secret',
      api_base: 'https://api.example.com/v1',
      max_tokens: undefined,
    });
  });
});
