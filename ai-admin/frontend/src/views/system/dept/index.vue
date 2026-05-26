<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetDeptList, fetchDeleteDept } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import DeptOperateModal from './modules/dept-operate-modal.vue';

const appStore = useAppStore();
const { bool: visible, setTrue: openModal } = useBoolean();
const { hasAuth } = useAuth();

const loading = ref(false);
const data = ref<Api.SystemManage.Dept[]>([]);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<Api.SystemManage.Dept | null>(null);

async function getData() {
  loading.value = true;
  try {
    const { error, data: list } = await fetchGetDeptList();
    if (!error) data.value = list;
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.Dept) {
  operateType.value = 'edit';
  editingData.value = { ...row };
  openModal();
}

async function handleDelete(id: string) {
  const { error } = await fetchDeleteDept(id);
  if (!error) getData();
}

const columns: any[] = [
  { key: 'name', title: '部门名称', minWidth: 150 },
  { key: 'sort', title: '排序', width: 80, align: 'center' },
  {
    key: 'status',
    title: '状态',
    width: 80,
    align: 'center',
    render: (row: Api.SystemManage.Dept) => (row.status === '1' ? '启用' : '禁用'),
  },
  {
    key: 'operate',
    title: '操作',
    width: 160,
    align: 'center',
    render: (row: Api.SystemManage.Dept) => (
      <div class="flex-center gap-8px">
        {hasAuth('dept:edit') && (
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>
            编辑
          </NButton>
        )}
        {hasAuth('dept:delete') && (
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  删除
                </NButton>
              ),
            }}
          </NPopconfirm>
        )}
      </div>
    ),
  },
];

getData();
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="部门管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NButton :loading="loading" @click="getData">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            刷新
          </NButton>
          <NButton v-permission="'dept:add'" type="primary" @click="handleAdd">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            新增
          </NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :loading="loading"
        :row-key="row => row.id"
        class="sm:h-full"
      />
      <DeptOperateModal
        v-model:visible="visible"
        :operate-type="operateType"
        :row-data="editingData"
        :all-depts="data"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>
