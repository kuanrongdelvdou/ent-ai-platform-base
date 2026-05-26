<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetConfigList, fetchDeleteConfig } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import ConfigModal from './modules/config-modal.vue';

const { bool: visible, setTrue: openModal } = useBoolean();
const { hasAuth } = useAuth();
const loading = ref(false);
const data = ref<Api.SystemManage.SysConfig[]>([]);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<Api.SystemManage.SysConfig | null>(null);

async function getData() {
  loading.value = true;
  try {
    const { error, data: list } = await fetchGetConfigList();
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

function handleEdit(row: Api.SystemManage.SysConfig) {
  operateType.value = 'edit';
  editingData.value = { ...row };
  openModal();
}

async function handleDelete(id: string) {
  const { error } = await fetchDeleteConfig(id);
  if (!error) getData();
}

const columns: any[] = [
  { key: 'key', title: '参数键', minWidth: 180 },
  { key: 'value', title: '参数值', minWidth: 200 },
  { key: 'remark', title: '备注', minWidth: 150 },
  {
    key: 'createTime',
    title: '创建时间',
    width: 180,
    align: 'center',
    render: (row: Api.SystemManage.SysConfig) => row.createTime?.slice(0, 19).replace('T', ' '),
  },
  {
    key: 'operate',
    title: '操作',
    width: 110,
    align: 'center',
    render: (row: Api.SystemManage.SysConfig) => (
      <div class="flex-center gap-8px">
        {hasAuth('config:edit') && (
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>
            编辑
          </NButton>
        )}
        {hasAuth('config:delete') && (
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
    <NCard title="系统参数" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NButton :loading="loading" @click="getData">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
          </NButton>
          <NButton v-permission="'config:add'" type="primary" @click="handleAdd">
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
      <ConfigModal
        v-model:visible="visible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>
