<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchAddConfig, fetchUpdateConfig } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'ConfigModal' });

interface Props {
  operateType: 'add' | 'edit';
  rowData?: Api.SystemManage.SysConfig | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增系统参数' : '编辑系统参数'));
const model = ref({ key: '', value: '', remark: '' });

function handleInitModel() {
  model.value = { key: '', value: '', remark: '' };
  if (props.operateType === 'edit' && props.rowData) {
    model.value = { key: props.rowData.key, value: props.rowData.value, remark: props.rowData.remark ?? '' };
  }
}

function closeModal() { visible.value = false; }

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchAddConfig(model.value);
    if (error) return;
  } else {
    const { error } = await fetchUpdateConfig(props.rowData!.id, { value: model.value.value, remark: model.value.remark });
    if (error) return;
  }
  window.$message?.success($t('common.updateSuccess'));
  closeModal();
  emit('submitted');
}

watch(visible, () => { if (visible.value) { handleInitModel(); restoreValidation(); } });
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-480px">
    <NForm ref="formRef" :model="model" label-placement="left" :label-width="80">
      <NFormItem label="参数键" path="key" :rule="defaultRequiredRule">
        <NInput v-model:value="model.key" placeholder="请输入参数键" :disabled="props.operateType === 'edit'" />
      </NFormItem>
      <NFormItem label="参数值" path="value" :rule="defaultRequiredRule">
        <NInput v-model:value="model.value" placeholder="请输入参数值" />
      </NFormItem>
      <NFormItem label="备注" path="remark">
        <NInput v-model:value="model.remark" type="textarea" placeholder="请输入备注" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
