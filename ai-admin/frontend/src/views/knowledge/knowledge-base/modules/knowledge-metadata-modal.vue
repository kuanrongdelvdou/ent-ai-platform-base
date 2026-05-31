<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NDynamicTags, NInput, NPopconfirm, NTag } from 'naive-ui';
import { fetchGetMetadataSummary, fetchUpdateDocumentsMetadata } from '@/service/api';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({ name: 'KnowledgeMetadataModal' });

interface Props {
  knowledgeBase?: Api.Knowledge.KnowledgeBase | null;
  documentIds?: string[];
  documentName?: string;
}

interface Emits {
  (e: 'saved'): void;
}

type MetadataRow = {
  id: string;
  sourceField: string;
  field: string;
  valueType: Api.Knowledge.MetadataValueType;
  values: string[];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const saving = ref(false);

const rows = ref<MetadataRow[]>([]);
const selectedRowKeys = ref<string[]>([]);
const originSummaryMap = ref(new Map<string, { valueType: Api.Knowledge.MetadataValueType; values: string[] }>());

const editVisible = ref(false);
const editingRowId = ref<string>('');
const editorField = ref('');
const editorValues = ref<string[]>([]);
const editorValueType = ref<Api.Knowledge.MetadataValueType>('string');

const valueTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'List', value: 'list' },
  { label: 'Time', value: 'time' },
  { label: 'Number', value: 'number' },
];

const effectiveDocIds = computed(() => (props.documentIds ?? []).map(item => String(item).trim()).filter(Boolean));

const secondaryTitle = computed(() => {
  if (props.documentName) return props.documentName;
  if (!effectiveDocIds.value.length) return '当前知识库';
  return `已选择 ${effectiveDocIds.value.length} 个文件`;
});

const columns = computed<DataTableColumns<MetadataRow>>(() => [
  {
    type: 'selection',
    width: 48,
    align: 'center',
  },
  {
    key: 'field',
    title: '字段',
    width: 180,
    ellipsis: { tooltip: true },
    render: row => h('span', { class: 'meta-row-field' }, row.field || '-'),
  },
  {
    key: 'valueType',
    title: '类型',
    width: 100,
    render: row => h('span', { class: 'meta-row-type' }, String(row.valueType || 'string')),
  },
  {
    key: 'values',
    title: '值',
    minWidth: 320,
    render: row =>
      row.values.length
        ? h(
            'div',
            { class: 'meta-row-values' },
            row.values.map(value =>
              h(
                NTag,
                {
                  key: `${row.id}:${value}`,
                  size: 'small',
                  bordered: false,
                },
                { default: () => value },
              ),
            ),
          )
        : h('span', { class: 'meta-row-empty' }, '空'),
  },
  {
    key: 'actions',
    title: '操作',
    width: 120,
    align: 'center',
    render: row =>
      h('div', { class: 'meta-row-actions' }, [
        h(
          NButton,
          {
            text: true,
            size: 'small',
            onClick: () => handleOpenEditRow(row),
          },
          { icon: () => h(SvgIcon, { icon: 'lucide:pen-line' }) },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => removeRow(row.id),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'error',
                  size: 'small',
                },
                { icon: () => h(SvgIcon, { icon: 'lucide:trash-2' }) },
              ),
            default: () => '确认删除该字段吗？',
          },
        ),
      ]),
  },
]);

function normalizeValues(values: string[]) {
  return [...new Set(values.map(item => item.trim()).filter(Boolean))];
}

function normalizeSummaryToRows(summary: Api.Knowledge.MetadataSummaryResult['summary']) {
  const nextRows: MetadataRow[] = [];
  const nextMap = new Map<string, { valueType: Api.Knowledge.MetadataValueType; values: string[] }>();

  Object.entries(summary ?? {}).forEach(([field, value]) => {
    if (!field) return;

    const valueList = Array.isArray(value)
      ? value
      : Array.isArray(value?.values)
        ? value.values
        : [];

    const values = normalizeValues(
      valueList
        .map(item => (Array.isArray(item) ? String(item[0] ?? '') : String(item ?? '')))
        .filter(Boolean),
    );

    const valueType = Array.isArray(value) ? 'string' : String(value?.type ?? 'string');

    nextRows.push({
      id: `${field}_${Math.random().toString(36).slice(2)}`,
      sourceField: field,
      field,
      valueType,
      values,
    });

    nextMap.set(field, { valueType, values: [...values] });
  });

  rows.value = nextRows;
  originSummaryMap.value = nextMap;
}

function resetModalState() {
  rows.value = [];
  selectedRowKeys.value = [];
  originSummaryMap.value = new Map();
  editVisible.value = false;
  editingRowId.value = '';
  editorField.value = '';
  editorValues.value = [];
  editorValueType.value = 'string';
}

async function loadMetadataSummary() {
  if (!props.knowledgeBase) return;
  loading.value = true;
  try {
    const { error, data } = await fetchGetMetadataSummary(props.knowledgeBase.id, effectiveDocIds.value);
    if (error) return;
    normalizeSummaryToRows(data?.summary ?? {});
  } finally {
    loading.value = false;
  }
}

function handleOpenCreateRow() {
  editingRowId.value = '';
  editorField.value = '';
  editorValues.value = [];
  editorValueType.value = 'string';
  editVisible.value = true;
}

function handleOpenEditRow(row: MetadataRow) {
  editingRowId.value = row.id;
  editorField.value = row.field;
  editorValues.value = [...row.values];
  editorValueType.value = row.valueType || 'string';
  editVisible.value = true;
}

function removeRow(rowId: string) {
  rows.value = rows.value.filter(item => item.id !== rowId);
  selectedRowKeys.value = selectedRowKeys.value.filter(item => item !== rowId);
}

function removeSelectedRows() {
  if (!selectedRowKeys.value.length) return;
  const selectedSet = new Set(selectedRowKeys.value);
  rows.value = rows.value.filter(item => !selectedSet.has(item.id));
  selectedRowKeys.value = [];
}

function handleSaveRow() {
  const field = editorField.value.trim();
  const values = normalizeValues(editorValues.value);
  const editingId = editingRowId.value;

  if (!field) {
    window.$message?.warning('请输入字段名');
    return;
  }

  const duplicate = rows.value.some(item => item.field === field && item.id !== editingId);
  if (duplicate) {
    window.$message?.warning('字段名不能重复');
    return;
  }

  if (!values.length) {
    window.$message?.warning('请至少添加一个字段值');
    return;
  }

  if (!editingId) {
    rows.value = [
      ...rows.value,
      {
        id: `${field}_${Date.now()}`,
        sourceField: '',
        field,
        values,
        valueType: editorValueType.value,
      },
    ];
  } else {
    rows.value = rows.value.map(item =>
      item.id === editingId
        ? {
            ...item,
            field,
            values,
            valueType: editorValueType.value,
          }
        : item,
    );
  }

  editVisible.value = false;
}

function buildMetadataOperations() {
  const updates: Api.Knowledge.MetadataUpdateOperation[] = [];
  const deletes: Api.Knowledge.MetadataDeleteOperation[] = [];

  const currentRows = rows.value.map(item => ({
    sourceField: item.sourceField.trim(),
    field: item.field.trim(),
    valueType: String(item.valueType || 'string'),
    values: normalizeValues(item.values),
  }));

  const currentFields = new Set(currentRows.map(item => item.field).filter(Boolean));

  const mergedCurrentMap = new Map<string, { valueType: string; values: string[] }>();
  currentRows.forEach(item => {
    if (!item.field) return;
    const existed = mergedCurrentMap.get(item.field);
    if (existed) {
      existed.values = normalizeValues([...existed.values, ...item.values]);
      return;
    }
    mergedCurrentMap.set(item.field, {
      valueType: item.valueType,
      values: [...item.values],
    });
  });

  currentRows.forEach(item => {
    if (item.sourceField && item.sourceField !== item.field) {
      deletes.push({ key: item.sourceField });
    }
  });

  originSummaryMap.value.forEach((origin, originField) => {
    if (!currentFields.has(originField)) {
      deletes.push({ key: originField });
      return;
    }

    const current = mergedCurrentMap.get(originField);
    if (!current) return;

    const originSet = new Set(origin.values);
    const currentSet = new Set(current.values);

    if (!current.values.length && origin.values.length) {
      deletes.push({ key: originField });
      return;
    }

    origin.values.forEach(value => {
      if (!currentSet.has(value)) {
        deletes.push({ key: originField, value });
      }
    });

    current.values.forEach(value => {
      if (!originSet.has(value)) {
        updates.push({
          key: originField,
          match: '',
          value,
          valueType: current.valueType,
        });
      }
    });
  });

  mergedCurrentMap.forEach((current, field) => {
    if (originSummaryMap.value.has(field)) return;
    current.values.forEach(value => {
      updates.push({
        key: field,
        match: '',
        value,
        valueType: current.valueType,
      });
    });
  });

  const dedupeDeleteMap = new Map<string, Api.Knowledge.MetadataDeleteOperation>();
  deletes.forEach(item => {
    const key = `${item.key}::${item.value ?? '__ALL__'}`;
    dedupeDeleteMap.set(key, item);
  });

  const dedupeUpdateMap = new Map<string, Api.Knowledge.MetadataUpdateOperation>();
  updates.forEach(item => {
    const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value ?? '');
    const key = `${item.key}::${item.match ?? ''}::${value}::${item.valueType ?? ''}`;
    dedupeUpdateMap.set(key, item);
  });

  return {
    updates: [...dedupeUpdateMap.values()],
    deletes: [...dedupeDeleteMap.values()],
  };
}

async function handleSaveMetadata() {
  if (!props.knowledgeBase) return;

  const invalid = rows.value.some(item => !item.field.trim() || !normalizeValues(item.values).length);
  if (invalid) {
    window.$message?.warning('请完善所有字段和字段值');
    return;
  }

  const duplicateSet = new Set<string>();
  for (const row of rows.value) {
    const field = row.field.trim();
    if (duplicateSet.has(field)) {
      window.$message?.warning(`字段名重复：${field}`);
      return;
    }
    duplicateSet.add(field);
  }

  const operations = buildMetadataOperations();
  if (!operations.updates.length && !operations.deletes.length) {
    visible.value = false;
    return;
  }

  saving.value = true;
  try {
    const { error } = await fetchUpdateDocumentsMetadata(props.knowledgeBase.id, {
      selector: effectiveDocIds.value.length ? { document_ids: effectiveDocIds.value } : undefined,
      updates: operations.updates,
      deletes: operations.deletes,
    });
    if (error) return;
    window.$message?.success('元数据已保存');
    visible.value = false;
    emit('saved');
  } finally {
    saving.value = false;
  }
}

watch(visible, async show => {
  if (!show) {
    resetModalState();
    return;
  }
  await loadMetadataSummary();
});

watch(
  () => props.knowledgeBase?.id,
  () => {
    if (visible.value) {
      void loadMetadataSummary();
    }
  },
);
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="元数据" class="meta-modal" :bordered="false">
    <section class="meta-modal__head">
      <p class="meta-modal__subtitle">{{ secondaryTitle }}</p>
      <div class="meta-modal__actions">
        <NButton :disabled="!selectedRowKeys.length" @click="removeSelectedRows">批量删除</NButton>
        <NButton type="primary" @click="handleOpenCreateRow">
          <template #icon>
            <SvgIcon icon="lucide:plus" />
          </template>
          新增字段
        </NButton>
      </div>
    </section>

    <NDataTable
      v-model:checked-row-keys="selectedRowKeys"
      :loading="loading"
      :columns="columns"
      :data="rows"
      :row-key="row => row.id"
      size="small"
      class="meta-modal__table"
    />

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="saving" @click="handleSaveMetadata">保存</NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal v-model:show="editVisible" preset="card" :title="editingRowId ? '编辑字段' : '新增字段'" class="meta-edit-modal">
    <NForm label-placement="top">
      <NFormItem label="字段名" required>
        <NInput v-model:value="editorField" placeholder="例如：source_url / category" maxlength="100" />
      </NFormItem>
      <NFormItem label="类型">
        <NSelect v-model:value="editorValueType" :options="valueTypeOptions" />
      </NFormItem>
      <NFormItem label="字段值" required>
        <NDynamicTags v-model:value="editorValues" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="editVisible = false">取消</NButton>
        <NButton type="primary" @click="handleSaveRow">确认</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.meta-modal {
  width: 920px;
  max-width: 95vw;
}

.meta-modal__head {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.meta-modal__subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.meta-modal__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.meta-modal__table {
  min-height: 300px;
}

:deep(.meta-row-values) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.meta-row-actions) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-edit-modal {
  width: 520px;
  max-width: 92vw;
}

@media (max-width: 1100px) {
  .meta-modal {
    width: 98vw;
  }

  .meta-modal__head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
