<script setup lang="tsx">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { enableStatusRecord, menuTypeRecord } from '@/constants/business';
import { fetchGetAllPages, fetchGetMenuList, fetchDeleteMenu } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import MenuOperateModal, { type OperateType } from './modules/menu-operate-modal.vue';

const appStore = useAppStore();
const { bool: visible, setTrue: openModal } = useBoolean();
const { hasAuth } = useAuth();

const { columns, columnChecks, data, loading, pagination, getData, getDataByPage } = useNaivePaginatedTable({
  api: () => fetchGetMenuList(),
  transform: response => defaultTransform(response),
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    {
      key: 'menuType', title: '类型', align: 'center', width: 80,
      render: row => {
        const tagMap: Record<Api.SystemManage.MenuType, NaiveUI.ThemeColor> = { 1: 'default', 2: 'primary' };
        return <NTag type={tagMap[row.menuType]}>{$t(menuTypeRecord[row.menuType])}</NTag>;
      },
    },
    { key: 'menuName', title: '菜单名称', align: 'center', minWidth: 120 },
    {
      key: 'icon', title: '图标', align: 'center', width: 60,
      render: row => (
        <div class="flex-center">
          <SvgIcon icon={row.iconType === '1' ? row.icon : undefined} localIcon={row.iconType === '2' ? row.icon : undefined} class="text-icon" />
        </div>
      ),
    },
    { key: 'routeName', title: '路由名称', align: 'center', minWidth: 120 },
    { key: 'routePath', title: '路由路径', align: 'center', minWidth: 120 },
    { key: 'order', title: '排序', align: 'center', width: 60 },
    {
      key: 'status', title: '状态', align: 'center', width: 80,
      render: row => {
        if (row.status === null) return null;
        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = { 1: 'success', 2: 'warning' };
        return <NTag type={tagMap[row.status]}>{$t(enableStatusRecord[row.status])}</NTag>;
      },
    },
    {
      key: 'operate', title: $t('common.operate'), align: 'center', width: 230,
      render: row => (
        <div class="flex-center gap-8px">
          {row.menuType === '1' && hasAuth('menu:add') && (
            <NButton type="primary" ghost size="small" onClick={() => handleAddChildMenu(row)}>
              新增子菜单
            </NButton>
          )}
          {hasAuth('menu:edit') && (
            <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('menu:delete') && (
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => <NButton type="error" ghost size="small">{$t('common.delete')}</NButton>,
              }}
            </NPopconfirm>
          )}
        </div>
      ),
    },
  ],
});

const { onDeleted } = useTableOperate(data, 'id', getData);

const operateType = ref<OperateType>('add');
const editingData: Ref<Api.SystemManage.Menu | null> = ref(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(item: Api.SystemManage.Menu) {
  operateType.value = 'edit';
  editingData.value = { ...item };
  openModal();
}

function handleAddChildMenu(item: Api.SystemManage.Menu) {
  operateType.value = 'addChild';
  editingData.value = { ...item };
  openModal();
}

async function handleDelete(id: string) {
  const { error } = await fetchDeleteMenu(id);
  if (!error) onDeleted();
}

const allPages = ref<string[]>([]);

async function init() {
  const { data: pages } = await fetchGetAllPages();
  allPages.value = pages || [];
}

init();
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="菜单管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="true"
          add-permission="menu:add"
          :loading="loading"
          @add="handleAdd"
          @refresh="getData"
        />
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="900"
        :loading="loading"
        :row-key="row => row.id"
        remote
        :pagination="pagination"
        class="sm:h-full"
      />
      <MenuOperateModal
        v-model:visible="visible"
        :operate-type="operateType"
        :row-data="editingData"
        :all-pages="allPages"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>
