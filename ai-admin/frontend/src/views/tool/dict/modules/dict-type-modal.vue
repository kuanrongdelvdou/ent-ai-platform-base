<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions } from '@/constants/business';
import { fetchAddDictType, fetchUpdateDictType } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'DictTypeModal' });

interface Props {
  operateType: 'add' | 'edit';
  rowData?: Api.SystemManage.DictType | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增字典类型' : '编辑字典类型'));

type Model = { name: string; code: string; remark: string; status: Api.Common.EnableStatus };

const model = ref<Model>({ name: '', code: '', remark: '', status: '1' });

function handleInitModel() {
  model.value = { name: '', code: '', remark: '', status: '1' };
  if (props.operateType === 'edit' && props.rowData) {
    model.value = { name: props.rowData.name, code: props.rowData.code, remark: props.rowData.remark ?? '', status: props.rowData.status ?? '1' };
  }
}

function closeModal() { visible.value = false; }

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchAddDictType(model.value);
    if (error) return;
  } else {
    const { error } = await fetchUpdateDictType(props.rowData!.id, model.value);
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
      <NFormItem label="字典名称" path="name" :rule="defaultRequiredRule">
        <NInput v-model:value="model.name" placeholder="请输入字典名称" />
      </NFormItem>
      <NFormItem label="字典编码" path="code" :rule="defaultRequiredRule">
        <NInput v-model:value="model.code" placeholder="请输入字典编码" :disabled="props.operateType === 'edit'" />
      </NFormItem>
      <NFormItem label="备注" path="remark">
        <NInput v-model:value="model.remark" type="textarea" placeholder="请输入备注" />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <NRadioGroup v-model:value="model.status">
          <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
        </NRadioGroup>
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
