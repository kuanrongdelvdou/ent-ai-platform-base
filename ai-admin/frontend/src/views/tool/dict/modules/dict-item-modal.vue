<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions } from '@/constants/business';
import { fetchAddDictItem, fetchUpdateDictItem } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'DictItemModal' });

interface Props {
  operateType: 'add' | 'edit';
  rowData?: Api.SystemManage.DictItem | null;
  dictTypeId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增字典数据' : '编辑字典数据'));

type Model = { label: string; value: string; sort: number; remark: string; status: Api.Common.EnableStatus };

const model = ref<Model>({ label: '', value: '', sort: 0, remark: '', status: '1' });

function handleInitModel() {
  model.value = { label: '', value: '', sort: 0, remark: '', status: '1' };
  if (props.operateType === 'edit' && props.rowData) {
    model.value = {
      label: props.rowData.label, value: props.rowData.value,
      sort: props.rowData.sort, remark: props.rowData.remark ?? '', status: props.rowData.status ?? '1',
    };
  }
}

function closeModal() { visible.value = false; }

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchAddDictItem({ ...model.value, dictTypeId: props.dictTypeId });
    if (error) return;
  } else {
    const { error } = await fetchUpdateDictItem(props.rowData!.id, model.value);
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
      <NFormItem label="标签" path="label" :rule="defaultRequiredRule">
        <NInput v-model:value="model.label" placeholder="请输入标签" />
      </NFormItem>
      <NFormItem label="值" path="value" :rule="defaultRequiredRule">
        <NInput v-model:value="model.value" placeholder="请输入值" />
      </NFormItem>
      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="model.sort" class="w-full" />
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
