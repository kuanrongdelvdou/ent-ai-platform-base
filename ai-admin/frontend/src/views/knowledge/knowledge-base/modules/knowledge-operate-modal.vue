<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { enableStatusOptions } from '@/constants/business';
import { fetchCreateKnowledgeBase, fetchGetAllRoles, fetchUpdateKnowledgeBase } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'KnowledgeOperateModal' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Knowledge.KnowledgeBase | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增知识库' : '编辑知识库'));

type Model = Api.Knowledge.KnowledgeBaseForm & {
  parserConfigText: string;
};

const model = ref(createDefaultModel());
const roleOptions = ref<CommonType.Option<string>[]>([]);

const chunkMethodOptions = [
  { label: '通用', value: 'naive' },
  { label: '手工', value: 'manual' },
  { label: '问答', value: 'qa' },
  { label: '表格', value: 'table' },
  { label: '论文', value: 'paper' },
  { label: '书籍', value: 'book' },
  { label: '法规', value: 'laws' }
];

const rules: Record<'name' | 'chunkMethod' | 'status', App.Global.FormRule> = {
  name: defaultRequiredRule,
  chunkMethod: defaultRequiredRule,
  status: defaultRequiredRule
};

function createDefaultModel(): Model {
  return {
    name: '',
    description: null,
    chunkMethod: 'naive',
    parserConfig: null,
    parserConfigText: '',
    status: '1',
    roleIds: []
  };
}

async function getRoleOptions() {
  const { error, data } = await fetchGetAllRoles();
  if (!error) {
    roleOptions.value = data.map(item => ({ label: `${item.roleName} (${item.roleCode})`, value: item.id }));
  }
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    const row = jsonClone(props.rowData);
    Object.assign(model.value, {
      name: row.name,
      description: row.description,
      chunkMethod: row.chunkMethod,
      parserConfig: row.parserConfig,
      parserConfigText: row.parserConfig ? JSON.stringify(row.parserConfig, null, 2) : '',
      status: row.status,
      roleIds: row.roleIds || []
    });
  }
}

function closeModal() {
  visible.value = false;
}

function buildPayload() {
  let parserConfig: Record<string, any> | null = null;

  if (model.value.parserConfigText.trim()) {
    try {
      parserConfig = JSON.parse(model.value.parserConfigText);
    } catch {
      window.$message?.error('解析配置必须是合法 JSON');
      return null;
    }
  }

  return {
    name: model.value.name,
    description: model.value.description,
    chunkMethod: model.value.chunkMethod,
    parserConfig,
    status: model.value.status,
    roleIds: model.value.roleIds
  };
}

async function handleSubmit() {
  await validate();

  const payload = buildPayload();
  if (!payload) return;

  const { error } =
    props.operateType === 'add'
      ? await fetchCreateKnowledgeBase(payload)
      : await fetchUpdateKnowledgeBase(props.rowData!.id, payload);

  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  closeModal();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
    getRoleOptions();
  }
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-640px max-w-90vw" :bordered="false">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="92">
      <NFormItem label="知识库名称" path="name">
        <NInput v-model:value="model.name" placeholder="请输入知识库名称" />
      </NFormItem>
      <NFormItem label="解析方式" path="chunkMethod">
        <NSelect v-model:value="model.chunkMethod" :options="chunkMethodOptions" placeholder="请选择解析方式" />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <NRadioGroup v-model:value="model.status">
          <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="可访问角色" path="roleIds">
        <NSelect v-model:value="model.roleIds" multiple clearable :options="roleOptions" placeholder="不选择则仅超级管理员可见" />
      </NFormItem>
      <NFormItem label="描述" path="description">
        <NInput v-model:value="model.description" type="textarea" placeholder="请输入知识库描述" />
      </NFormItem>
      <NFormItem label="解析配置" path="parserConfigText">
        <NInput
          v-model:value="model.parserConfigText"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 8 }"
          placeholder='可选，JSON 格式，例如 {"chunk_token_num": 512}'
        />
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
