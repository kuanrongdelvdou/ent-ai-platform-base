<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import type { FlatResponseData } from '@sa/axios';
import { useBoolean } from '@sa/hooks';
import { enableStatusRecord } from '@/constants/business';
import { fetchDeleteKnowledgeBase, fetchGetKnowledgeBaseList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import KnowledgeOperateModal from './modules/knowledge-operate-modal.vue';
import KnowledgeSearchModal from './modules/knowledge-search-modal.vue';
import KnowledgeUploadModal from './modules/knowledge-upload-modal.vue';

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { bool: searchVisible, setTrue: openSearchModal } = useBoolean();
const { bool: uploadVisible, setTrue: openUploadModal } = useBoolean();

const currentKnowledgeBase = ref<Api.Knowledge.KnowledgeBase | null>(null);
const searchParams = ref<Api.Knowledge.KnowledgeBaseSearchParams>({
  current: 1,
  size: 10,
  name: null,
  status: null
});

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '2' }
];

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable<
  FlatResponseData<any, Api.Knowledge.KnowledgeBaseList>,
  Api.Knowledge.KnowledgeBase
>({
  api: () => fetchGetKnowledgeBaseList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    { key: 'index', title: $t('common.index'), align: 'center', width: 64, render: (_, index) => index + 1 },
    { key: 'name', title: '知识库名称', minWidth: 180, ellipsis: { tooltip: true } },
    { key: 'description', title: '描述', minWidth: 220, ellipsis: { tooltip: true } },
    {
      key: 'chunkMethod',
      title: '解析方式',
      width: 100,
      align: 'center',
      render: row => <NTag size="small">{row.chunkMethod}</NTag>
    },
    {
      key: 'status',
      title: '状态',
      width: 90,
      align: 'center',
      render: row => {
        if (!row.status) return null;

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = { 1: 'success', 2: 'warning' };

        return <NTag type={tagMap[row.status]}>{$t(enableStatusRecord[row.status])}</NTag>;
      }
    },
    {
      key: 'roles',
      title: '授权角色',
      minWidth: 160,
      render: row => {
        const roleNames = row.roles?.map(item => item.roleName).join('、') || '';

        return roleNames || `${row.roleIds?.length || 0} 个角色`;
      }
    },
    {
      key: 'updateTime',
      title: '更新时间',
      width: 180,
      align: 'center',
      render: row => row.updateTime?.slice(0, 19).replace('T', ' ') || '-'
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      width: 300,
      align: 'center',
      fixed: 'right',
      render: row => (
        <div class="flex-center gap-8px">
          <NButton ghost size="small" onClick={() => handleOpenUpload(row)}>
            文档
          </NButton>
          <NButton ghost size="small" onClick={() => handleOpenSearch(row)}>
            检索
          </NButton>
          {hasAuth('knowledge:edit') && (
            <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
              {$t('common.edit')}
            </NButton>
          )}
          {hasAuth('knowledge:delete') && (
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => (
                  <NButton type="error" ghost size="small">
                    {$t('common.delete')}
                  </NButton>
                )
              }}
            </NPopconfirm>
          )}
        </div>
      )
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, onDeleted } = useTableOperate(data, 'id', getData);

async function handleSearch() {
  await getDataByPage(1);
}

async function handleDelete(id: string) {
  const { error } = await fetchDeleteKnowledgeBase(id);

  if (!error) {
    onDeleted();
  }
}

function handleOpenUpload(row: Api.Knowledge.KnowledgeBase) {
  currentKnowledgeBase.value = row;
  openUploadModal();
}

function handleOpenSearch(row: Api.Knowledge.KnowledgeBase) {
  currentKnowledgeBase.value = row;
  openSearchModal();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="知识库管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="true"
          add-permission="knowledge:add"
          :loading="loading"
          @add="handleAdd"
          @refresh="getData"
        />
      </template>

      <NSpace class="mb-16px" :size="12" align="center">
        <NInput
          v-model:value="searchParams.name"
          clearable
          class="w-240px"
          placeholder="搜索知识库名称"
          @keyup.enter="handleSearch"
        />
        <NSelect v-model:value="searchParams.status" clearable class="w-140px" :options="statusOptions" placeholder="状态" />
        <NButton type="primary" ghost :loading="loading" @click="handleSearch">
          <template #icon>
            <icon-ic-round-search class="text-icon" />
          </template>
          查询
        </NButton>
      </NSpace>

      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1180"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />

      <KnowledgeOperateModal
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <KnowledgeUploadModal v-model:visible="uploadVisible" :knowledge-base="currentKnowledgeBase" />
      <KnowledgeSearchModal v-model:visible="searchVisible" :knowledge-base="currentKnowledgeBase" />
    </NCard>
  </div>
</template>
