<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { enableStatusOptions } from '@/constants/business';
import { fetchGetAllRoles, fetchAddUser, fetchUpdateUser } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'UserOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.User | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增用户' : '编辑用户'));

type Model = Pick<Api.SystemManage.User, 'userName' | 'nickName' | 'userPhone' | 'userEmail' | 'userRoles' | 'status'>;

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return { userName: '', nickName: '', userPhone: '', userEmail: '', userRoles: [], status: null };
}

const rules: Record<'userName' | 'status', App.Global.FormRule> = {
  userName: defaultRequiredRule,
  status: defaultRequiredRule,
};

const roleOptions = ref<CommonType.Option<string>[]>([]);

async function getRoleOptions() {
  const { error, data } = await fetchGetAllRoles();
  if (!error) {
    roleOptions.value = data.map(item => ({ label: item.roleName, value: item.roleCode }));
  }
}

function handleInitModel() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchAddUser({ ...model.value, password: 'soybean123' });
    if (error) return;
  } else {
    const { error } = await fetchUpdateUser(props.rowData!.id, model.value);
    if (error) return;
  }
  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
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
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem label="用户名" path="userName">
          <NInput v-model:value="model.userName" placeholder="请输入用户名" :disabled="props.operateType === 'edit'" />
        </NFormItem>
        <NFormItem label="姓名" path="nickName">
          <NInput v-model:value="model.nickName" placeholder="请输入姓名" />
        </NFormItem>
        <NFormItem label="手机号" path="userPhone">
          <NInput v-model:value="model.userPhone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem label="邮箱" path="userEmail">
          <NInput v-model:value="model.userEmail" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="角色" path="userRoles">
          <NSelect v-model:value="model.userRoles" multiple :options="roleOptions" placeholder="请选择角色" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
