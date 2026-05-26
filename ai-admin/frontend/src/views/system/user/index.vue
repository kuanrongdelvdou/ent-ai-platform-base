<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord } from '@/constants/business';
import { fetchGetUserList, fetchDeleteUser } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserSearch from './modules/user-search.vue';

const appStore = useAppStore();
const checkedRowKeys = ref<string[]>([]);
const { hasAuth } = useAuth();

const searchParams = ref<Api.SystemManage.UserSearchParams>({
  current: 1, size: 10, status: null, userName: null, userGender: null,
  nickName: null, userPhone: null, userEmail: null,
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetUserList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'index', title: $t('common.index'), align: 'center', width: 64, render: (_, i) => i + 1 },
    { key: 'userName', title: '用户名', align: 'center', minWidth: 100 },
    { key: 'nickName', title: '姓名', align: 'center', minWidth: 100 },
    { key: 'userPhone', title: '手机号', align: 'center', width: 120 },
    { key: 'userEmail', title: '邮箱', align: 'center', minWidth: 180 },
    {
      key: 'status', title: '状态', align: 'center', width: 80,
      render: row => {
        if (row.status === null) return null;
        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = { 1: 'success', 2: 'warning' };
        return <NTag type={tagMap[row.status]}>{$t(enableStatusRecord[row.status])}</NTag>;
      },
    },
    {
      key: 'operate', title: $t('common.operate'), align: 'center', width: 130,
      render: row => (
        <div class="flex-center gap-8px">
          {hasAuth('user:edit') && (
            <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('user:delete') && (
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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, onDeleted } = useTableOperate(data, 'id', getData);

async function handleDelete(id: string) {
  const { error } = await fetchDeleteUser(id);
  if (!error) onDeleted();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <UserSearch v-model:model="searchParams" @search="getDataByPage" />
    <NCard title="用户管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="true"
          add-permission="user:add"
          :loading="loading"
          @add="handleAdd"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="800"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>
