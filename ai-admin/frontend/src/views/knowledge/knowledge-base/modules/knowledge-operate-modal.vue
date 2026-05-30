<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { jsonClone } from '@sa/utils';
import {
  fetchCreateKnowledgeBase,
  fetchGetAiHubModelConfig,
  fetchGetDataPipelines,
  fetchUpdateKnowledgeBase
} from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'KnowledgeOperateModal' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Knowledge.KnowledgeBase | null;
}

interface Emits {
  (e: 'submitted'): void;
}

type Model = Api.Knowledge.KnowledgeBaseForm;

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '创建知识库' : '编辑知识库'));
const model = ref(createDefaultModel());
const modelConfig = ref<Api.Knowledge.AiModelConfig | null>(null);
const dataPipelines = ref<Api.Knowledge.DataPipeline[]>([]);
const modelConfigLoading = ref(false);
const pipelineLoading = ref(false);

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

const embeddingModelOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = [];
  const seen = new Set<string>();

  function addOption(modelName: string, factory?: string) {
    const value = composeModelId(modelName, factory);
    if (!value || seen.has(value)) return;
    seen.add(value);
    options.push({ label: value, value });
  }

  Object.entries(modelConfig.value?.myModels ?? {}).forEach(([factory, group]) => {
    group.llm
      ?.filter(item => item.type === 'embedding' && item.status !== '0')
      .forEach(item => addOption(item.name, factory));
  });

  const defaultEmbedding = modelConfig.value?.readiness.defaultModels.embedding?.id;
  if (defaultEmbedding) addOption(defaultEmbedding);

  return options;
});

const pipelineOptions = computed<SelectOption[]>(() =>
  dataPipelines.value.map(item => ({ label: item.name, value: item.id }))
);

const rules: Record<'name' | 'embeddingModel' | 'chunkMethod' | 'pipelineId', App.Global.FormRule> = {
  name: defaultRequiredRule,
  embeddingModel: defaultRequiredRule,
  chunkMethod: {
    trigger: 'change',
    validator: () => {
      if (model.value.parseType === 1 && !model.value.chunkMethod) {
        return new Error('请选择分块方法');
      }
      return true;
    }
  },
  pipelineId: {
    trigger: 'change',
    validator: () => {
      if (model.value.parseType === 2 && !model.value.pipelineId) {
        return new Error('请选择 pipeline');
      }
      return true;
    }
  }
};

function createDefaultModel(): Model {
  return {
    name: '',
    description: null,
    embeddingModel: '',
    parseType: 1,
    chunkMethod: null,
    pipelineId: null,
    parserConfig: null,
    status: '1',
    roleIds: [],
    deptId: null,
    visibility: 'dept'
  };
}

function composeModelId(modelName?: string | null, factory?: string) {
  const name = String(modelName ?? '').trim();
  if (!name) return '';
  if (!factory || name.includes('@')) return name;
  return `${name}@${factory}`;
}

async function getModelConfig() {
  modelConfigLoading.value = true;
  try {
    const { error, data } = await fetchGetAiHubModelConfig();
    if (!error) {
      modelConfig.value = data;
      const defaultEmbedding = data.readiness.defaultModels.embedding?.id;
      if (!model.value.embeddingModel && defaultEmbedding) {
        model.value.embeddingModel = defaultEmbedding;
      }
    }
  } finally {
    modelConfigLoading.value = false;
  }
}

async function getDataPipelineOptions() {
  pipelineLoading.value = true;
  try {
    const { error, data } = await fetchGetDataPipelines();
    if (!error) {
      dataPipelines.value = data;
    }
  } finally {
    pipelineLoading.value = false;
  }
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    const row = jsonClone(props.rowData);
    Object.assign(model.value, {
      name: row.name,
      description: row.description,
      embeddingModel: row.embeddingModelId || '',
      parseType: row.parseType || (row.pipelineId ? 2 : 1),
      chunkMethod: row.chunkMethod || null,
      pipelineId: row.pipelineId || null,
      parserConfig: row.parserConfig,
      status: row.status,
      roleIds: row.roleIds || [],
      deptId: row.deptId || null,
      visibility: row.visibility || 'dept'
    });
  }
}

function closeModal() {
  visible.value = false;
}

function buildPayload(): Model {
  return {
    ...model.value,
    chunkMethod: model.value.parseType === 1 ? model.value.chunkMethod : null,
    pipelineId: model.value.parseType === 2 ? model.value.pipelineId : null
  };
}

async function handleSubmit() {
  await validate();

  const payload = buildPayload();
  const { error } =
    props.operateType === 'add'
      ? await fetchCreateKnowledgeBase(payload)
      : await fetchUpdateKnowledgeBase(props.rowData!.id, payload);

  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  closeModal();
  emit('submitted');
}

watch(
  () => model.value.parseType,
  value => {
    if (value === 1) {
      model.value.pipelineId = null;
    } else {
      model.value.chunkMethod = null;
    }
  }
);

watch(visible, async () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
    await Promise.all([getModelConfig(), getDataPipelineOptions()]);
  }
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-560px max-w-90vw" :bordered="false">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
      <NFormItem label="名称" path="name">
        <NInput v-model:value="model.name" placeholder="请输入名称" />
      </NFormItem>

      <NFormItem label="嵌入模型" path="embeddingModel">
        <NSelect
          v-model:value="model.embeddingModel"
          filterable
          clearable
          :loading="modelConfigLoading"
          :options="embeddingModelOptions"
          placeholder="请选择嵌入模型"
        />
      </NFormItem>

      <NFormItem label="解析方法" path="parseType">
        <NRadioGroup v-model:value="model.parseType">
          <NSpace :size="48">
            <NRadio v-for="item in parseTypeOptions" :key="item.value" :value="item.value" :label="item.label" />
          </NSpace>
        </NRadioGroup>
      </NFormItem>

      <NFormItem v-if="model.parseType === 1" label="内置" path="chunkMethod">
        <NSelect
          v-model:value="model.chunkMethod"
          filterable
          clearable
          :options="chunkMethodOptions"
          placeholder="请选择分块方法"
        />
      </NFormItem>

      <NFormItem v-else label="选择 pipeline" path="pipelineId">
        <NSelect
          v-model:value="model.pipelineId"
          filterable
          clearable
          :loading="pipelineLoading"
          :options="pipelineOptions"
          placeholder="请选择 pipeline"
        />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput v-model:value="model.description" type="textarea" placeholder="请输入知识库描述" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
