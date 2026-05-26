<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions } from '@/constants/business';
import { fetchAddDept, fetchUpdateDept } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'DeptOperateModal' });

interface Props {
  operateType: 'add' | 'edit';
  rowData?: Api.SystemManage.Dept | null;
  allDepts: Api.SystemManage.Dept[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增部门' : '编辑部门'));

type Model = { parentId: string | null; name: string; sort: number; status: Api.Common.EnableStatus };

const model = ref<Model>({ parentId: null, name: '', sort: 0, status: '1' });

const parentOptions = computed(() =>
  props.allDepts.map(d => ({ label: d.name, value: d.id }))
);

function handleInitModel() {
  model.value = { parentId: null, name: '', sort: 0, status: '1' };
  if (props.operateType === 'edit' && props.rowData) {
    model.value = {
      parentId: props.rowData.parentId,
      name: props.rowData.name,
      sort: props.rowData.sort,
      status: props.rowData.status,
    };
  }
}

function closeModal() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchAddDept(model.value);
    if (error) return;
  } else {
    const { error } = await fetchUpdateDept(props.rowData!.id, model.value);
    if (error) return;
  }
  window.$message?.success($t('common.updateSuccess'));
  closeModal();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-480px">
    <NForm ref="formRef" :model="model" label-placement="left" :label-width="80">
      <NFormItem label="上级部门" path="parentId">
        <NSelect v-model:value="model.parentId" :options="parentOptions" clearable placeholder="请选择上级部门（不选则为顶级）" />
      </NFormItem>
      <NFormItem label="部门名称" path="name" :rule="defaultRequiredRule">
        <NInput v-model:value="model.name" placeholder="请输入部门名称" />
      </NFormItem>
      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="model.sort" class="w-full" placeholder="排序值" />
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
