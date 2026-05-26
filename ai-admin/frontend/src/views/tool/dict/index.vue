<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { enableStatusRecord } from '@/constants/business';
import { fetchGetDictTypeList, fetchDeleteDictType, fetchGetDictItemList, fetchDeleteDictItem } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import DictTypeModal from './modules/dict-type-modal.vue';
import DictItemModal from './modules/dict-item-modal.vue';

const appStore = useAppStore();
const { bool: typeVisible, setTrue: openTypeModal } = useBoolean();
const { bool: itemVisible, setTrue: openItemModal } = useBoolean();
const { hasAuth } = useAuth();

const typeLoading = ref(false);
const typeData = ref<Api.SystemManage.DictType[]>([]);
const typeOperateType = ref<'add' | 'edit'>('add');
const editingType = ref<Api.SystemManage.DictType | null>(null);

const itemLoading = ref(false);
const itemData = ref<Api.SystemManage.DictItem[]>([]);
const itemOperateType = ref<'add' | 'edit'>('add');
const editingItem = ref<Api.SystemManage.DictItem | null>(null);
const selectedTypeId = ref('');
const selectedTypeName = ref('');

async function getTypeData() {
  typeLoading.value = true;
  try {
    const { error, data } = await fetchGetDictTypeList();
    if (!error) typeData.value = data;
  } finally {
    typeLoading.value = false;
  }
}

async function getItemData(typeId: string) {
  itemLoading.value = true;
  try {
    const { error, data } = await fetchGetDictItemList(typeId);
    if (!error) itemData.value = data;
  } finally {
    itemLoading.value = false;
  }
}

function handleAddType() {
  typeOperateType.value = 'add';
  editingType.value = null;
  openTypeModal();
}

function handleEditType(row: Api.SystemManage.DictType) {
  typeOperateType.value = 'edit';
  editingType.value = { ...row };
  openTypeModal();
}

async function handleDeleteType(id: string) {
  const { error } = await fetchDeleteDictType(id);
  if (!error) {
    getTypeData();
    if (selectedTypeId.value === id) {
      selectedTypeId.value = '';
      itemData.value = [];
    }
  }
}

function handleSelectType(row: Api.SystemManage.DictType) {
  selectedTypeId.value = row.id;
  selectedTypeName.value = row.name;
  getItemData(row.id);
}

function handleAddItem() {
  itemOperateType.value = 'add';
  editingItem.value = null;
  openItemModal();
}

function handleEditItem(row: Api.SystemManage.DictItem) {
  itemOperateType.value = 'edit';
  editingItem.value = { ...row };
  openItemModal();
}

async function handleDeleteItem(id: string) {
  const { error } = await fetchDeleteDictItem(id);
  if (!error) getItemData(selectedTypeId.value);
}

const typeColumns: any[] = [
  { key: 'name', title: '字典名称', minWidth: 100 },
  { key: 'code', title: '字典编码', minWidth: 100 },
  {
    key: 'status',
    title: '状态',
    width: 70,
    align: 'center',
    render: (row: Api.SystemManage.DictType) => {
      const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = { 1: 'success', 2: 'warning' };
      return row.status ? (
        <NTag type={tagMap[row.status]} size="small">
          {$t(enableStatusRecord[row.status])}
        </NTag>
      ) : null;
    },
  },
  {
    key: 'operate',
    title: '操作',
    width: 130,
    align: 'center',
    render: (row: Api.SystemManage.DictType) => (
      <div class="flex-center gap-4px">
        <NButton type="info" ghost size="small" onClick={() => handleSelectType(row)}>
          数据
        </NButton>
        {hasAuth('dict:edit') && (
          <NButton type="primary" ghost size="small" onClick={() => handleEditType(row)}>
            编辑
          </NButton>
        )}
        {hasAuth('dict:delete') && (
          <NPopconfirm onPositiveClick={() => handleDeleteType(row.id)}>
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

const itemColumns: any[] = [
  { key: 'label', title: '标签', minWidth: 100 },
  { key: 'value', title: '值', minWidth: 100 },
  { key: 'sort', title: '排序', width: 70, align: 'center' },
  { key: 'remark', title: '备注', minWidth: 100 },
  {
    key: 'operate',
    title: '操作',
    width: 110,
    align: 'center',
    render: (row: Api.SystemManage.DictItem) => (
      <div class="flex-center gap-8px">
        {hasAuth('dict:edit') && (
          <NButton type="primary" ghost size="small" onClick={() => handleEditItem(row)}>
            编辑
          </NButton>
        )}
        {hasAuth('dict:delete') && (
          <NPopconfirm onPositiveClick={() => handleDeleteItem(row.id)}>
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

getTypeData();
</script>

<template>
  <div class="flex gap-16px overflow-hidden lt-sm:flex-col">
    <NCard title="字典类型" :bordered="false" size="small" class="card-wrapper w-400px flex-shrink-0">
      <template #header-extra>
        <NSpace>
          <NButton :loading="typeLoading" @click="getTypeData">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
          </NButton>
          <NButton v-permission="'dict:add'" type="primary" @click="handleAddType">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            新增
          </NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="typeColumns"
        :data="typeData"
        size="small"
        :loading="typeLoading"
        :row-key="row => row.id"
      />
    </NCard>

    <NCard :title="selectedTypeName ? `字典数据 - ${selectedTypeName}` : '字典数据'" :bordered="false" size="small" class="card-wrapper flex-1">
      <template #header-extra>
        <NButton v-permission="'dict:add'" type="primary" :disabled="!selectedTypeId" @click="handleAddItem">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          新增
        </NButton>
      </template>
      <NDataTable
        :columns="itemColumns"
        :data="itemData"
        size="small"
        :loading="itemLoading"
        :row-key="row => row.id"
      />
    </NCard>

    <DictTypeModal
      v-model:visible="typeVisible"
      :operate-type="typeOperateType"
      :row-data="editingType"
      @submitted="getTypeData"
    />
    <DictItemModal
      v-model:visible="itemVisible"
      :operate-type="itemOperateType"
      :row-data="editingItem"
      :dict-type-id="selectedTypeId"
      @submitted="() => getItemData(selectedTypeId)"
    />
  </div>
</template>
