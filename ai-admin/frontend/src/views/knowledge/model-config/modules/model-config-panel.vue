<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { FormInst, SelectOption } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { fetchAddAiModel, fetchGetAiHubModelConfig, fetchSetDefaultAiModels } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { useAuthStore } from '@/store/modules/auth';

type ModelFilter = 'all' | Api.Knowledge.AiModelType;

type ProviderMeta = {
  label: string;
  icon: string;
  accent: string;
  defaultTypes: Api.Knowledge.AiModelType[];
};

type ProviderCard = ProviderMeta & {
  factory: string;
  keyword: string;
  modelCount: number;
  connected: boolean;
  types: Api.Knowledge.AiModelType[];
};

const emit = defineEmits<{
  updated: [];
}>();

const loading = ref(false);
const savingModel = ref(false);
const savingDefault = ref(false);
const addModelVisible = ref(false);
const providerSearch = ref('');
const activeCapability = ref<ModelFilter>('all');
const config = ref<Api.Knowledge.AiModelConfig | null>(null);
const addFormRef = ref<FormInst | null>(null);
const { hasAuth } = useAuth();
const authStore = useAuthStore();

const addForm = ref<Api.Knowledge.AddAiModelForm>({
  llmFactory: 'OpenAI-API-Compatible',
  modelType: 'chat',
  modelName: '',
  apiKey: '',
  apiBase: '',
  maxTokens: null
});

const defaultForm = ref<Api.Knowledge.SetDefaultModelsForm>({
  llmId: '',
  embeddingId: ''
});

const capabilityOptions: Array<{ label: string; value: ModelFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'LLM', value: 'chat' },
  { label: 'Embedding', value: 'embedding' },
  { label: 'Rerank', value: 'rerank' },
  { label: 'TTS', value: 'tts' },
  { label: 'ASR', value: 'speech2text' },
  { label: 'VLM', value: 'image2text' },
  { label: 'OCR', value: 'ocr' }
];

const modelTypeOptions: SelectOption[] = [
  { label: 'LLM', value: 'chat' },
  { label: 'Embedding', value: 'embedding' },
  { label: 'Rerank', value: 'rerank' },
  { label: 'OCR', value: 'ocr' },
  { label: 'TTS', value: 'tts' },
  { label: 'ASR', value: 'speech2text' },
  { label: 'VLM', value: 'image2text' }
];

const commonFactories = [
  'OpenAI',
  'Anthropic',
  'Gemini',
  'Moonshot',
  'DeepSeek',
  'OpenAI-API-Compatible',
  'Ollama',
  'Xinference',
  'Tongyi-Qianwen',
  'ZHIPU-AI',
  'SiliconFlow',
  'VolcEngine'
];

const providerMetaMap: Record<string, ProviderMeta> = {
  openai: {
    label: 'OpenAI',
    icon: 'simple-icons:openai',
    accent: '#111827',
    defaultTypes: ['chat', 'embedding', 'rerank', 'tts', 'speech2text']
  },
  anthropic: {
    label: 'Anthropic',
    icon: 'simple-icons:anthropic',
    accent: '#111827',
    defaultTypes: ['chat']
  },
  gemini: {
    label: 'Gemini',
    icon: 'simple-icons:googlegemini',
    accent: '#4f7cff',
    defaultTypes: ['chat', 'embedding', 'image2text']
  },
  moonshot: {
    label: 'Moonshot',
    icon: 'solar:moon-stars-bold-duotone',
    accent: '#111827',
    defaultTypes: ['chat', 'embedding', 'image2text']
  },
  deepseek: {
    label: 'DeepSeek',
    icon: 'simple-icons:deepseek',
    accent: '#4f6bff',
    defaultTypes: ['chat']
  },
  openaiapicompatible: {
    label: 'OpenAI API Compatible',
    icon: 'solar:programming-bold-duotone',
    accent: '#0f766e',
    defaultTypes: ['chat', 'embedding', 'rerank']
  },
  ollama: {
    label: 'Ollama',
    icon: 'simple-icons:ollama',
    accent: '#111827',
    defaultTypes: ['chat', 'embedding', 'image2text']
  },
  xinference: {
    label: 'Xinference',
    icon: 'solar:server-square-cloud-bold-duotone',
    accent: '#2563eb',
    defaultTypes: ['chat', 'embedding', 'rerank']
  },
  tongyiqianwen: {
    label: '通义千问',
    icon: 'solar:cloud-bolt-bold-duotone',
    accent: '#7c3aed',
    defaultTypes: ['chat', 'embedding', 'image2text']
  },
  zhipuai: {
    label: '智谱 AI',
    icon: 'solar:atom-bold-duotone',
    accent: '#2563eb',
    defaultTypes: ['chat', 'embedding', 'image2text']
  },
  siliconflow: {
    label: 'SiliconFlow',
    icon: 'solar:cpu-bolt-bold-duotone',
    accent: '#10b981',
    defaultTypes: ['chat', 'embedding', 'rerank', 'image2text']
  },
  volcengine: {
    label: '火山引擎',
    icon: 'solar:fire-bold-duotone',
    accent: '#ea580c',
    defaultTypes: ['chat', 'embedding', 'image2text']
  }
};

const addRules = {
  llmFactory: { required: true, message: '请选择模型供应商', trigger: 'change' },
  modelType: { required: true, message: '请选择模型类型', trigger: 'change' },
  modelName: { required: true, message: '请输入模型名称', trigger: 'blur' },
  apiKey: { required: true, message: '请输入 API Key', trigger: 'blur' }
};

const readiness = computed(() => config.value?.readiness ?? null);
const canManageModel = computed(() => authStore.userInfo.roles.includes('super') || hasAuth('model:config'));
const readinessReady = computed(() => readiness.value?.status === 'READY');

const factoryOptions = computed<SelectOption[]>(() => {
  const names = new Set(commonFactories);
  Object.keys(config.value?.myModels ?? {}).forEach(item => names.add(item));
  Object.keys(config.value?.availableModels ?? {}).forEach(item => names.add(item));

  return [...names].map(item => ({ label: getProviderMeta(item).label, value: item }));
});

const availableModelOptions = computed(() => {
  const options: Array<SelectOption & { modelType: Api.Knowledge.AiModelType }> = [];
  const seen = new Set<string>();

  function pushModel(factory: string, name: string, modelType: Api.Knowledge.AiModelType, available = true) {
    if (!available || !name || !factory) return;
    const value = `${name}@${factory}`;
    if (seen.has(value)) return;
    seen.add(value);
    options.push({
      label: `${name} · ${getProviderMeta(factory).label}`,
      value,
      modelType
    });
  }

  Object.entries(config.value?.availableModels ?? {}).forEach(([factory, models]) => {
    models.forEach(model => pushModel(model.fid || factory, model.llm_name, model.model_type, model.available !== false));
  });

  Object.entries(config.value?.myModels ?? {}).forEach(([factory, group]) => {
    group.llm?.forEach(model => pushModel(factory, model.name, model.type, model.status !== '0'));
  });

  return options;
});

const llmOptions = computed(() => availableModelOptions.value.filter(item => item.modelType === 'chat'));
const embeddingOptions = computed(() => availableModelOptions.value.filter(item => item.modelType === 'embedding'));

const providerCards = computed<ProviderCard[]>(() => {
  const names = new Set(commonFactories);
  Object.keys(config.value?.availableModels ?? {}).forEach(item => names.add(item));
  Object.keys(config.value?.myModels ?? {}).forEach(item => names.add(item));

  return [...names].map(factory => {
    const meta = getProviderMeta(factory);
    const availableModels = config.value?.availableModels?.[factory] ?? [];
    const addedModels = config.value?.myModels?.[factory]?.llm ?? [];
    const types = uniqueModelTypes([
      ...meta.defaultTypes,
      ...availableModels.map(item => item.model_type),
      ...addedModels.map(item => item.type)
    ]);

    return {
      ...meta,
      factory,
      keyword: `${factory} ${meta.label}`.toLowerCase(),
      modelCount: availableModels.length,
      connected: addedModels.length > 0,
      types
    };
  });
});

const filteredProviderCards = computed(() => {
  const keyword = providerSearch.value.trim().toLowerCase();

  return providerCards.value.filter(provider => {
    const matchKeyword = !keyword || provider.keyword.includes(keyword);
    const matchType = activeCapability.value === 'all' || provider.types.includes(activeCapability.value);

    return matchKeyword && matchType;
  });
});

const modelGroups = computed(() => {
  return Object.entries(config.value?.myModels ?? {})
    .map(([factory, group]) => ({
      factory,
      provider: getProviderMeta(factory),
      models: group.llm ?? []
    }))
    .filter(group => group.models.length);
});

function normalizeFactory(factory: string) {
  return factory.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getProviderMeta(factory: string): ProviderMeta {
  const key = normalizeFactory(factory);
  const meta = providerMetaMap[key];

  if (meta) return meta;

  return {
    label: factory,
    icon: 'solar:cpu-bolt-bold-duotone',
    accent: '#64748b',
    defaultTypes: ['chat', 'embedding']
  };
}

function uniqueModelTypes(types: Api.Knowledge.AiModelType[]) {
  return [...new Set(types)].filter(Boolean);
}

function getTypeLabel(type: Api.Knowledge.AiModelType) {
  const labelMap: Record<Api.Knowledge.AiModelType, string> = {
    chat: 'LLM',
    embedding: 'Embedding',
    rerank: 'Rerank',
    tts: 'TTS',
    speech2text: 'ASR',
    image2text: 'VLM',
    ocr: 'OCR'
  };

  return labelMap[type] || type;
}

function syncDefaultForm() {
  const defaultModels = config.value?.readiness.defaultModels;
  defaultForm.value = {
    llmId: defaultModels?.llm?.id ?? '',
    embeddingId: defaultModels?.embedding?.id ?? ''
  };
}

async function loadConfig() {
  loading.value = true;
  try {
    const { error, data } = await fetchGetAiHubModelConfig();
    if (!error) {
      config.value = data;
      syncDefaultForm();
    }
  } finally {
    loading.value = false;
  }
}

function openAddModelModal(provider?: ProviderCard) {
  if (!canManageModel.value) {
    window.$message?.warning('当前账号没有模型配置权限');
    return;
  }

  if (provider) {
    const selectedType =
      activeCapability.value !== 'all'
        ? activeCapability.value
        : provider.types.includes('chat')
          ? 'chat'
          : provider.types[0] || 'chat';

    addForm.value.llmFactory = provider.factory;
    addForm.value.modelType = selectedType;
  }

  addModelVisible.value = true;
}

async function handleAddModel() {
  if (!canManageModel.value) {
    window.$message?.warning('当前账号没有模型配置权限');
    return;
  }

  await addFormRef.value?.validate();

  savingModel.value = true;
  try {
    const payload = { ...addForm.value };
    if (!payload.apiBase) delete payload.apiBase;
    if (!payload.maxTokens) delete payload.maxTokens;

    const { error } = await fetchAddAiModel(payload);
    if (!error) {
      window.$message?.success('模型已保存');
      addForm.value.apiKey = '';
      addForm.value.modelName = '';
      addModelVisible.value = false;
      await loadConfig();
      emit('updated');
    }
  } finally {
    savingModel.value = false;
  }
}

async function handleSaveDefault() {
  if (!canManageModel.value) {
    window.$message?.warning('当前账号没有模型配置权限');
    return;
  }

  if (!defaultForm.value.llmId || !defaultForm.value.embeddingId) {
    window.$message?.warning('请选择默认 LLM 和 Embedding');
    return;
  }

  savingDefault.value = true;
  try {
    const { error } = await fetchSetDefaultAiModels(defaultForm.value);
    if (!error) {
      window.$message?.success('默认模型已保存');
      await loadConfig();
      emit('updated');
    }
  } finally {
    savingDefault.value = false;
  }
}

onMounted(loadConfig);
</script>

<template>
  <NSpin :show="loading">
    <section class="model-config">
      <aside class="model-config__sidebar" aria-label="AI 设置导航">
        <nav class="model-config__side-nav">
          <button class="model-config__side-item" type="button">
            <SvgIcon icon="solar:server-square-linear" />
            <span>数据源</span>
          </button>
          <button class="model-config__side-item model-config__side-item--active" type="button">
            <SvgIcon icon="solar:box-minimalistic-linear" />
            <span>模型提供商</span>
          </button>
          <button class="model-config__side-item" type="button">
            <SvgIcon icon="solar:link-round-angle-linear" />
            <span>MCP</span>
          </button>
          <button class="model-config__side-item" type="button">
            <SvgIcon icon="solar:users-group-rounded-linear" />
            <span>团队</span>
          </button>
          <button class="model-config__side-item" type="button">
            <SvgIcon icon="solar:user-id-linear" />
            <span>概要</span>
          </button>
          <button class="model-config__side-item" type="button">
            <SvgIcon icon="solar:plug-circle-linear" />
            <span>API</span>
          </button>
        </nav>
      </aside>

      <main class="model-config__workspace">
        <section class="model-config__default-panel" aria-label="设置默认模型">
          <div class="model-config__section-head">
            <div>
              <NText tag="h2" class="model-config__title">设置默认模型</NText>
              <NText class="model-config__desc">请在开始之前完成这些设置</NText>
            </div>
            <NTag :type="readinessReady ? 'success' : 'warning'" round :bordered="false">
              {{ readinessReady ? '模型已就绪' : '待配置模型' }}
            </NTag>
          </div>

          <div class="model-config__default-card">
            <div class="model-config__form-row model-config__form-row--required">
              <label>LLM</label>
              <NSelect
                v-model:value="defaultForm.llmId"
                filterable
                clearable
                :disabled="!canManageModel"
                :options="llmOptions"
                placeholder="请选择模型"
              />
            </div>
            <div class="model-config__form-row">
              <label>Embedding</label>
              <NSelect
                v-model:value="defaultForm.embeddingId"
                filterable
                clearable
                :disabled="!canManageModel"
                :options="embeddingOptions"
                placeholder="请选择模型"
              />
            </div>
            <div class="model-config__form-row">
              <label>VLM</label>
              <NSelect disabled placeholder="后续接入" />
            </div>
            <div class="model-config__form-row">
              <label>ASR</label>
              <NSelect disabled placeholder="后续接入" />
            </div>
            <div class="model-config__form-row">
              <label>Rerank</label>
              <NSelect disabled placeholder="后续接入" />
            </div>
            <div class="model-config__form-row">
              <label>TTS</label>
              <NSelect disabled placeholder="后续接入" />
            </div>
          </div>

          <div class="model-config__default-actions">
            <NButton type="primary" :disabled="!canManageModel" :loading="savingDefault" @click="handleSaveDefault">
              保存默认模型
            </NButton>
          </div>
        </section>

        <section class="model-config__provider-panel" aria-label="可选模型">
          <div class="model-config__section-head">
            <NText tag="h2" class="model-config__panel-title">可选模型</NText>
            <NButton size="small" secondary :disabled="!canManageModel" @click="openAddModelModal()">
              <template #icon>
                <SvgIcon icon="solar:add-circle-linear" />
              </template>
              添加模型
            </NButton>
          </div>

          <NInput v-model:value="providerSearch" clearable placeholder="搜索" class="model-config__provider-search">
            <template #prefix>
              <SvgIcon icon="ri:search-2-line" />
            </template>
          </NInput>

          <div class="model-config__type-filter">
            <button
              v-for="item in capabilityOptions"
              :key="item.value"
              class="model-config__filter-chip"
              :class="{ 'model-config__filter-chip--active': activeCapability === item.value }"
              type="button"
              @click="activeCapability = item.value"
            >
              {{ item.label }}
            </button>
          </div>

          <div class="model-config__providers">
            <button
              v-for="provider in filteredProviderCards"
              :key="provider.factory"
              class="model-config__provider-card"
              type="button"
              :style="{ '--provider-accent': provider.accent }"
              @click="openAddModelModal(provider)"
            >
              <span class="model-config__provider-icon">
                <SvgIcon :icon="provider.icon" />
              </span>
              <span class="model-config__provider-body">
                <span class="model-config__provider-name">
                  {{ provider.label }}
                  <SvgIcon icon="solar:arrow-right-up-linear" />
                </span>
                <span class="model-config__provider-tags">
                  <span v-for="type in provider.types" :key="`${provider.factory}-${type}`" class="model-config__tag">
                    {{ getTypeLabel(type) }}
                  </span>
                </span>
              </span>
              <NTag v-if="provider.connected" size="small" type="success" :bordered="false">已接入</NTag>
            </button>
          </div>
        </section>

        <section class="model-config__added-panel" aria-label="添加了的模型">
          <div class="model-config__section-head">
            <NText tag="h2" class="model-config__panel-title">添加了的模型</NText>
            <NText class="model-config__desc">保存后的模型不会回显 API Key</NText>
          </div>

          <NEmpty v-if="!modelGroups.length" description="暂无模型" class="model-config__empty" />
          <div v-else class="model-config__added-list">
            <article
              v-for="group in modelGroups"
              :key="group.factory"
              class="model-config__added-group"
              :style="{ '--provider-accent': group.provider.accent }"
            >
              <div class="model-config__added-provider">
                <span class="model-config__provider-icon model-config__provider-icon--small">
                  <SvgIcon :icon="group.provider.icon" />
                </span>
                <strong>{{ group.provider.label }}</strong>
              </div>
              <div class="model-config__added-models">
                <NTag
                  v-for="model in group.models"
                  :key="`${group.factory}-${model.name}-${model.type}`"
                  :bordered="false"
                >
                  {{ model.name }} · {{ getTypeLabel(model.type) }}
                </NTag>
              </div>
            </article>
          </div>
        </section>
      </main>

      <NModal v-model:show="addModelVisible" preset="card" title="添加模型" class="model-config__modal" :bordered="false">
        <NForm ref="addFormRef" :model="addForm" :rules="addRules" label-placement="top">
          <NGrid cols="1 s:2" responsive="screen" :x-gap="14" :y-gap="6">
            <NGi>
              <NFormItem label="供应商" path="llmFactory">
                <NSelect
                  v-model:value="addForm.llmFactory"
                  filterable
                  tag
                  :options="factoryOptions"
                  placeholder="OpenAI-API-Compatible"
                />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="模型类型" path="modelType">
                <NSelect v-model:value="addForm.modelType" :options="modelTypeOptions" />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="模型名称" path="modelName">
                <NInput v-model:value="addForm.modelName" placeholder="例如 qwen-plus / text-embedding-v4" />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="Max Tokens" path="maxTokens">
                <NInputNumber v-model:value="addForm.maxTokens" class="w-full" clearable :min="1" placeholder="8192" />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="API Key" path="apiKey">
                <NInput v-model:value="addForm.apiKey" type="password" show-password-on="click" placeholder="sk-..." />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="Base URL" path="apiBase">
                <NInput v-model:value="addForm.apiBase" placeholder="https://api.example.com/v1" />
              </NFormItem>
            </NGi>
          </NGrid>

          <div class="model-config__modal-actions">
            <NButton @click="addModelVisible = false">取消</NButton>
            <NButton type="primary" :loading="savingModel" @click="handleAddModel">验证并保存</NButton>
          </div>
        </NForm>
      </NModal>
    </section>
  </NSpin>
</template>

<style scoped>
.model-config {
  --panel-border: rgba(17, 24, 39, 0.1);
  --panel-muted: #6b7280;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 244px minmax(0, 1fr);
  color: #111827;
  background: #fff;
}

.dark .model-config {
  --panel-border: rgba(255, 255, 255, 0.1);
  --panel-muted: rgba(255, 255, 255, 0.62);
  color: #f9fafb;
  background: #101014;
}

.model-config__sidebar {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 28px 18px;
  border-right: 1px solid var(--panel-border);
}

.model-config__side-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-config__side-item {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  color: var(--panel-muted);
  background: transparent;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.model-config__side-item:hover,
.model-config__side-item:focus-visible,
.model-config__side-item--active {
  color: #111827;
  background: #f0f0f0;
  outline: none;
}

.dark .model-config__side-item:hover,
.dark .model-config__side-item:focus-visible,
.dark .model-config__side-item--active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.model-config__workspace {
  min-width: 0;
  height: 100vh;
  display: grid;
  grid-template-areas:
    'defaults providers'
    'added providers';
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.9fr);
  grid-template-rows: minmax(430px, auto) minmax(220px, 1fr);
  overflow: hidden;
}

.model-config__default-panel,
.model-config__provider-panel,
.model-config__added-panel {
  min-width: 0;
  padding: 24px 28px;
}

.model-config__default-panel {
  grid-area: defaults;
  overflow: auto;
}

.model-config__provider-panel {
  grid-area: providers;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
  border-left: 1px solid var(--panel-border);
}

.model-config__added-panel {
  grid-area: added;
  overflow: auto;
  border-top: 1px solid var(--panel-border);
}

.model-config__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.model-config__title,
.model-config__panel-title {
  display: block;
  margin: 0;
  color: inherit;
  font-weight: 700;
}

.model-config__title {
  font-size: 24px;
  line-height: 1.35;
}

.model-config__panel-title {
  font-size: 18px;
  line-height: 1.4;
}

.model-config__desc {
  display: block;
  margin-top: 4px;
  color: var(--panel-muted);
  font-size: 14px;
}

.model-config__default-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: #fff;
}

.dark .model-config__default-card,
.dark .model-config__provider-card,
.dark .model-config__added-group {
  background: #17181f;
}

.model-config__form-row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}

.model-config__form-row label {
  position: relative;
  color: var(--panel-muted);
  font-size: 15px;
}

.model-config__form-row--required label::before {
  content: '*';
  margin-right: 2px;
  color: #ef4444;
}

.model-config__default-actions {
  margin-top: 18px;
}

.model-config__provider-search {
  flex: 0 0 auto;
}

.model-config__type-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.model-config__filter-chip {
  height: 24px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  color: #333;
  background: #f0f0f0;
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.model-config__filter-chip--active {
  color: #fff;
  background: #111827;
}

.dark .model-config__filter-chip {
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.1);
}

.dark .model-config__filter-chip--active {
  color: #111827;
  background: #fff;
}

.model-config__providers {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
  padding-right: 4px;
}

.model-config__provider-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  color: inherit;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.model-config__provider-card:hover,
.model-config__provider-card:focus-visible {
  border-color: color-mix(in srgb, var(--provider-accent) 42%, transparent);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
  outline: none;
  transform: translateY(-1px);
}

.model-config__provider-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--provider-accent);
  background: color-mix(in srgb, var(--provider-accent) 10%, #fff);
  font-size: 25px;
}

.model-config__provider-icon--small {
  width: 30px;
  height: 30px;
  font-size: 18px;
}

.dark .model-config__provider-icon {
  background: color-mix(in srgb, var(--provider-accent) 22%, #17181f);
}

.model-config__provider-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-config__provider-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;
  font-size: 17px;
  font-weight: 600;
}

.model-config__provider-tags,
.model-config__added-models {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.model-config__tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 7px;
  border-radius: 6px;
  color: #777;
  background: #f1f1f1;
  font-size: 12px;
  line-height: 1;
}

.dark .model-config__tag {
  color: rgba(255, 255, 255, 0.68);
  background: rgba(255, 255, 255, 0.1);
}

.model-config__empty {
  padding-top: 24px;
}

.model-config__added-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.model-config__added-group {
  padding: 16px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: #fff;
}

.model-config__added-provider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.model-config__modal {
  width: 720px;
  max-width: 92vw;
}

.model-config__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 1280px) {
  .model-config {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .model-config__workspace {
    grid-template-areas:
      'defaults'
      'providers'
      'added';
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(320px, auto) auto;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .model-config__provider-panel {
    border-top: 1px solid var(--panel-border);
    border-left: 0;
  }

  .model-config__providers {
    max-height: 520px;
  }
}

@media (max-width: 768px) {
  .model-config {
    grid-template-columns: minmax(0, 1fr);
  }

  .model-config__sidebar {
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--panel-border);
  }

  .model-config__side-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .model-config__default-panel,
  .model-config__provider-panel,
  .model-config__added-panel {
    padding: 18px;
  }

  .model-config__form-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
}
</style>
