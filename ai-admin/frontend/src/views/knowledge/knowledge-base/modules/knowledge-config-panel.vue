<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { fetchGetAiHubModelConfig, fetchGetDataPipelines, fetchUpdateKnowledgeBase } from '@/service/api';

interface Props {
  knowledgeBase: Api.Knowledge.KnowledgeBase;
}

const props = defineProps<Props>();

const saving = ref(false);
const loading = ref(false);
const modelConfig = ref<Api.Knowledge.AiModelConfig | null>(null);
const dataPipelines = ref<Api.Knowledge.DataPipeline[]>([]);

const parseTypeOptions = [
  { label: '内置', value: 1 },
  { label: '选择 pipeline', value: 2 }
];

const chunkMethodOptions: SelectOption[] = [
  { label: 'General', value: 'naive' },
  { label: 'Q&A', value: 'qa' },
  { label: 'Resume', value: 'resume' },
  { label: 'Manual', value: 'manual' },
  { label: 'Table', value: 'table' },
  { label: 'Paper', value: 'paper' },
  { label: 'Book', value: 'book' },
  { label: 'Laws', value: 'laws' },
  { label: 'Presentation', value: 'presentation' },
  { label: 'Picture', value: 'picture' },
  { label: 'Audio', value: 'audio' },
  { label: 'Email', value: 'email' },
  { label: 'One', value: 'one' },
  { label: 'Tag', value: 'tag' },
  { label: 'Knowledge Graph', value: 'knowledge_graph' }
];

const form = ref({
  name: '',
  description: '',
  embeddingModel: '',
  parseType: 1,
  chunkMethod: 'naive',
  pipelineId: '',
  status: '1'
});

const embeddingOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = [];
  const seen = new Set<string>();
  Object.entries(modelConfig.value?.myModels ?? {}).forEach(([factory, group]) => {
    group.llm
      ?.filter(item => item.type === 'embedding' && item.status !== '0')
      .forEach(item => {
        const id = item.name.includes('@') ? item.name : `${item.name}@${factory}`;
        if (!seen.has(id)) {
          seen.add(id);
          options.push({ label: id, value: id });
        }
      });
  });
  const defaultEmbedding = modelConfig.value?.readiness.defaultModels.embedding?.id;
  if (defaultEmbedding && !seen.has(defaultEmbedding)) {
    options.unshift({ label: defaultEmbedding, value: defaultEmbedding });
  }
  return options;
});

const pipelineOptions = computed<SelectOption[]>(() =>
  dataPipelines.value.map(item => ({ label: item.name, value: item.id }))
);

function syncFormFromKnowledgeBase() {
  form.value = {
    name: props.knowledgeBase.name || '',
    description: props.knowledgeBase.description || '',
    embeddingModel: props.knowledgeBase.embeddingModelId || '',
    parseType: props.knowledgeBase.parseType || (props.knowledgeBase.pipelineId ? 2 : 1),
    chunkMethod: props.knowledgeBase.chunkMethod || 'naive',
    pipelineId: props.knowledgeBase.pipelineId || '',
    status: props.knowledgeBase.status || '1'
  };
}

async function loadMeta() {
  loading.value = true;
  try {
    const [{ error: configError, data: configData }, { error: pipelineError, data: pipelineData }] = await Promise.all([
      fetchGetAiHubModelConfig(),
      fetchGetDataPipelines()
    ]);
    if (!configError) modelConfig.value = configData;
    if (!pipelineError) dataPipelines.value = pipelineData || [];
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!form.value.name.trim()) {
    window.$message?.warning('请输入知识库名称');
    return;
  }
  if (!form.value.embeddingModel) {
    window.$message?.warning('请选择嵌入模型');
    return;
  }
  if (form.value.parseType === 1 && !form.value.chunkMethod) {
    window.$message?.warning('请选择内置分块方法');
    return;
  }
  if (form.value.parseType === 2 && !form.value.pipelineId) {
    window.$message?.warning('请选择 pipeline');
    return;
  }

  saving.value = true;
  try {
    const { error } = await fetchUpdateKnowledgeBase(props.knowledgeBase.id, {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      embeddingModel: form.value.embeddingModel,
      parseType: form.value.parseType,
      chunkMethod: form.value.parseType === 1 ? form.value.chunkMethod : null,
      pipelineId: form.value.parseType === 2 ? form.value.pipelineId : null,
      status: form.value.status as Api.Common.EnableStatus
    });
    if (error) return;
    window.$message?.success('知识库配置已保存');
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.knowledgeBase.id,
  () => {
    syncFormFromKnowledgeBase();
    loadMeta();
  },
  { immediate: true }
);

watch(
  () => form.value.parseType,
  value => {
    if (value === 1) form.value.pipelineId = '';
    if (value === 2) form.value.chunkMethod = '';
  }
);
</script>

<template>
  <NSpin :show="loading">
    <section class="config-panel">
      <header class="config-panel__header">
        <h3>配置</h3>
        <p>保持与 RAGFlow 配置行为一致，修改后即时作用于当前知识库。</p>
      </header>

      <NForm label-placement="top" size="small">
        <NGrid cols="1 s:2" responsive="screen" :x-gap="12" :y-gap="4">
          <NGi>
            <NFormItem label="名称" required>
              <NInput v-model:value="form.name" maxlength="128" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="嵌入模型" required>
              <NSelect
                v-model:value="form.embeddingModel"
                filterable
                clearable
                :options="embeddingOptions"
                placeholder="请选择嵌入模型"
              />
            </NFormItem>
          </NGi>
        </NGrid>

        <NFormItem label="解析方式">
          <NRadioGroup v-model:value="form.parseType">
            <NSpace :size="40">
              <NRadio v-for="item in parseTypeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>

        <NFormItem v-if="form.parseType === 1" label="内置" required>
          <NSelect
            v-model:value="form.chunkMethod"
            filterable
            clearable
            :options="chunkMethodOptions"
            placeholder="请选择分块方法"
          />
        </NFormItem>
        <NFormItem v-else label="选择 pipeline" required>
          <NSelect
            v-model:value="form.pipelineId"
            filterable
            clearable
            :options="pipelineOptions"
            placeholder="请选择 pipeline"
          />
        </NFormItem>

        <NFormItem label="描述">
          <NInput v-model:value="form.description" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" />
        </NFormItem>

        <NFormItem label="状态">
          <NRadioGroup v-model:value="form.status">
            <NSpace :size="32">
              <NRadio value="1">是</NRadio>
              <NRadio value="2">否</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>
      </NForm>

      <footer class="config-panel__footer">
        <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
      </footer>
    </section>
  </NSpin>
</template>

<style scoped>
.config-panel {
  max-width: 980px;
  padding: 8px 2px 16px;
}

.config-panel__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.config-panel__header p {
  margin: 6px 0 12px;
  color: #6b7280;
  font-size: 13px;
}

.config-panel__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
