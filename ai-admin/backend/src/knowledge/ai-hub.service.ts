import { BadRequestException, Injectable } from '@nestjs/common';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { AddAiModelDto, SetDefaultModelsDto } from './dto/ai-hub.dto';
import { RagflowApiService } from './ragflow-api.service';

export type AiReadinessStatus = 'NOT_CONFIGURED' | 'PARTIAL' | 'READY' | 'ERROR';

type RagflowTenantModels = {
  tenant_id?: string;
  llm_id?: string;
  embd_id?: string;
  asr_id?: string;
  img2txt_id?: string;
};

export type AiReadiness = {
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

type RagflowModelList = Record<string, unknown>;

@Injectable()
export class AiHubService {
  private readonly log = new AppLoggerService('AiHubService');

  constructor(private readonly ragflow: RagflowApiService) {}

  async getReadiness(): Promise<AiReadiness> {
    this.log.debug('检查 AI 能力就绪状态');
    const result = await this.ragflow.getDefaultModels<RagflowTenantModels>();

    if (!result.success) {
      this.log.warn('AI 能力就绪检测失败', { error: result.error });
      return {
        status: 'ERROR',
        defaultModels: { llm: null, embedding: null, rerank: null },
        missing: ['ragflow'],
        canInitialize: true,
        message: result.error,
      };
    }

    const data = result.data ?? {};
    const llmId = this.cleanModelId(data.llm_id);
    const embeddingId = this.cleanModelId(data.embd_id);
    const missing = [
      ...(llmId ? [] : ['llm']),
      ...(embeddingId ? [] : ['embedding']),
    ];

    const status: AiReadinessStatus = missing.length === 0
      ? 'READY'
      : missing.length === 2
        ? 'NOT_CONFIGURED'
        : 'PARTIAL';

    this.log.info('AI 能力就绪检测完成', {
      status,
      tenantId: data.tenant_id,
      missing,
    });

    return {
      status,
      tenantId: data.tenant_id,
      defaultModels: {
        llm: llmId ? { id: llmId, name: llmId } : null,
        embedding: embeddingId ? { id: embeddingId, name: embeddingId } : null,
        rerank: null,
      },
      missing,
      canInitialize: true,
    };
  }

  async assertReady() {
    const readiness = await this.getReadiness();
    if (readiness.status !== 'READY') {
      this.log.warn('AI 能力未就绪，阻止知识库操作', {
        status: readiness.status,
        missing: readiness.missing,
      });
      throw new BadRequestException('AI_MODEL_NOT_READY：AI 能力尚未初始化，请联系管理员');
    }
    return readiness;
  }

  async getModelConfig() {
    this.log.debug('加载 AI 模型配置');
    const [readiness, myModelsResult, availableModelsResult] = await Promise.all([
      this.getReadiness(),
      this.ragflow.getMyLlms<RagflowModelList>(),
      this.ragflow.listLlms<RagflowModelList>(),
    ]);

    if (!myModelsResult.success) {
      this.log.warn('加载已添加模型失败', { error: myModelsResult.error });
    }
    if (!availableModelsResult.success) {
      this.log.warn('加载可选模型失败', { error: availableModelsResult.error });
    }

    return {
      readiness,
      myModels: myModelsResult.data ?? {},
      availableModels: availableModelsResult.data ?? {},
      errors: {
        myModels: myModelsResult.error,
        availableModels: availableModelsResult.error,
      },
    };
  }

  async addModel(dto: AddAiModelDto) {
    this.log.info('添加 AI 模型配置', {
      llmFactory: dto.llmFactory,
      modelType: dto.modelType,
      modelName: dto.modelName,
    });
    const result = await this.ragflow.addModel({
      llm_factory: dto.llmFactory,
      model_type: dto.modelType,
      llm_name: dto.modelName,
      api_key: dto.apiKey,
      api_base: dto.apiBase,
      max_tokens: dto.maxTokens,
    });

    if (!result.success) {
      this.log.warn('添加 AI 模型配置失败', {
        llmFactory: dto.llmFactory,
        modelType: dto.modelType,
        modelName: dto.modelName,
        error: result.error,
      });
      throw new BadRequestException(result.error || 'AI_MODEL_ADD_FAILED：模型添加失败');
    }

    return true;
  }

  async setDefaultModels(dto: SetDefaultModelsDto) {
    this.log.info('设置默认 AI 模型', {
      llmId: dto.llmId,
      embeddingId: dto.embeddingId,
    });

    const current = await this.ragflow.getDefaultModels<RagflowTenantModels>();
    if (!current.success || !current.data?.tenant_id) {
      this.log.warn('设置默认 AI 模型失败，无法读取租户模型信息', { error: current.error });
      throw new BadRequestException(current.error || 'AI_MODEL_TENANT_NOT_FOUND：无法读取 RAGFlow 租户模型信息');
    }

    const payload = {
      tenant_id: current.data.tenant_id,
      llm_id: dto.llmId,
      embd_id: dto.embeddingId,
      asr_id: this.cleanModelId(current.data.asr_id) ?? '',
      img2txt_id: this.cleanModelId(current.data.img2txt_id) ?? '',
    };

    const result = await this.ragflow.updateDefaultModels(payload);
    if (!result.success) {
      this.log.warn('设置默认 AI 模型失败', {
        llmId: dto.llmId,
        embeddingId: dto.embeddingId,
        error: result.error,
      });
      throw new BadRequestException(result.error || 'AI_MODEL_DEFAULT_FAILED：默认模型保存失败');
    }

    return true;
  }

  private cleanModelId(value?: string | null) {
    const modelId = String(value ?? '').trim();
    return modelId || null;
  }
}
