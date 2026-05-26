<script setup lang="ts">
import { shallowRef, watch } from 'vue';
import { fetchGetMenuTree, fetchUpdateRole } from '@/service/api';
import { $t } from '@/locales';

defineOptions({ name: 'MenuAuthModal' });

interface Props {
  roleId: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

function closeModal() {
  visible.value = false;
}

const tree = shallowRef<Api.SystemManage.MenuTree[]>([]);
const checks = shallowRef<string[]>([]);

async function init() {
  const { error, data } = await fetchGetMenuTree();
  if (!error) tree.value = data;
  // 初始化时不预选（后续可扩展查询角色已有菜单）
  checks.value = [];
}

async function handleSubmit() {
  const { error } = await fetchUpdateRole(props.roleId, { menuIds: checks.value });
  if (!error) {
    window.$message?.success($t('common.modifySuccess'));
    closeModal();
  }
}

watch(visible, val => {
  if (val) init();
});
</script>

<template>
  <NModal v-model:show="visible" title="菜单权限" preset="card" class="w-480px">
    <NTree
      v-model:checked-keys="checks"
      :data="tree"
      key-field="id"
      label-field="label"
      checkable
      expand-on-click
      virtual-scroll
      block-line
      class="h-320px"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton size="small" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" size="small" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
