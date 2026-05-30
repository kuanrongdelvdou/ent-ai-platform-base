<script setup lang="tsx">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NTag } from 'naive-ui';
import { fetchGetIngestionLog, fetchGetIngestionLogs, fetchGetIngestionSummary } from '@/service/api';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  knowledgeBase: Api.Knowledge.KnowledgeBase;
}

const props = defineProps<Props>();

const summaryLoading = ref(false);
const summary = ref<Api.Knowledge.IngestionSummary | null>(null);

const loading = ref(false);
const logs = ref<Api.Knowledge.IngestionLogItem[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const keywords = ref('');
const logType = ref<'file' | 'dataset'>('file');

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailJson = ref<Record<string, any> | null>(null);

const typeOptions: Array<{ label: string; value: 'file' | 'dataset' }> = [
  { label: '文件日志', value: 'file' },
  { label: '知识库日志', value: 'dataset' }
];

const statusTextMap: Record<string, string> = {
  UNSTART: '待解析',
  RUNNING: '解析中',
  CANCEL: '已停止',
  DONE: '已完成',
  FAIL: '失败',
  SCHEDULE: '排队中'
};

const statusTypeMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  UNSTART: 'default',
  RUNNING: 'info',
  CANCEL: 'warning',
  DONE: 'success',
  FAIL: 'error',
  SCHEDULE: 'warning'
};

const statusSummary = computed(() => {
  const source = (summary.value?.status ?? {}) as Record<string, number>;
  return {
    done: Number(source.DONE ?? source.done ?? source.success ?? 0),
    running: Number(source.RUNNING ?? source.running ?? 0),
    fail: Number(source.FAIL ?? source.fail ?? 0)
  };
});

const columns = computed<DataTableColumns<Api.Knowledge.IngestionLogItem>>(() => [
  {
    key: 'document_name',
    title: '文件名',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: row => row.document_name || '-'
  },
  {
    key: 'task_type',
    title: '任务',
    width: 120,
    render: row => row.task_type || '-'
  },
  {
    key: 'operation_status',
    title: '状态',
    width: 120,
    render: row => {
      const state = String(row.operation_status || '').toUpperCase();
      return h(
        NTag,
        { size: 'small', bordered: false, type: statusTypeMap[state] || 'default' },
        { default: () => statusTextMap[state] || state || '-' }
      );
    }
  },
  {
    key: 'pipeline_title',
    title: '解析',
    width: 140,
    render: row => row.pipeline_title || 'General'
  },
  {
    key: 'process_begin_at',
    title: '开始时间',
    width: 180,
    render: row => formatDate(row.process_begin_at || row.create_time)
  },
  {
    key: 'process_duration',
    title: '耗时',
    width: 100,
    align: 'center',
    render: row => {
      const value = Number(row.process_duration ?? row.process_duation ?? 0);
      if (!Number.isFinite(value) || value <= 0) return '-';
      return `${Math.round(value)}s`;
    }
  },
  {
    key: 'actions',
    title: '操作',
    width: 90,
    align: 'center',
    render: row =>
      h(
        NButton,
        {
          text: true,
          size: 'small',
          onClick: () => handleOpenDetail(row.id)
        },
        {
          icon: () => h(SvgIcon, { icon: 'lucide:eye' })
        }
      )
  }
]);

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => `${num}`.padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function loadSummary() {
  summaryLoading.value = true;
  try {
    const { error, data } = await fetchGetIngestionSummary(props.knowledgeBase.id);
    if (error) return;
    summary.value = data ?? null;
  } finally {
    summaryLoading.value = false;
  }
}

async function loadLogs(resetPage = false) {
  if (resetPage) page.value = 1;

  loading.value = true;
  try {
    const { error, data } = await fetchGetIngestionLogs(props.knowledgeBase.id, {
      page: page.value,
      page_size: pageSize.value,
      keywords: keywords.value || undefined,
      log_type: logType.value
    });
    if (error || !data) return;
    logs.value = Array.isArray(data.logs) ? data.logs : [];
    total.value = Number(data.total ?? logs.value.length);
  } finally {
    loading.value = false;
  }
}

async function handleOpenDetail(logId: string) {
  detailLoading.value = true;
  detailVisible.value = true;
  try {
    const { error, data } = await fetchGetIngestionLog(props.knowledgeBase.id, logId);
    if (error) return;
    detailJson.value = (data ?? null) as Record<string, any> | null;
  } finally {
    detailLoading.value = false;
  }
}

function handlePageChange(current: number) {
  page.value = current;
  loadLogs(false);
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  loadLogs(true);
}

watch(
  () => props.knowledgeBase.id,
  () => {
    loadSummary();
    loadLogs(true);
  },
  { immediate: true }
);
</script>

<template>
  <section class="log-panel">
    <header class="log-panel__toolbar">
      <div class="log-panel__cards">
        <NSpin :show="summaryLoading" size="small">
          <div class="log-panel__card">
            <p>文件数</p>
            <strong>{{ summary?.doc_num ?? 0 }}</strong>
          </div>
        </NSpin>
        <NSpin :show="summaryLoading" size="small">
          <div class="log-panel__card">
            <p>分块数</p>
            <strong>{{ summary?.chunk_num ?? 0 }}</strong>
          </div>
        </NSpin>
        <NSpin :show="summaryLoading" size="small">
          <div class="log-panel__card">
            <p>Token 数</p>
            <strong>{{ summary?.token_num ?? 0 }}</strong>
          </div>
        </NSpin>
        <NSpin :show="summaryLoading" size="small">
          <div class="log-panel__card">
            <p>状态(D/R/F)</p>
            <strong>{{ statusSummary.done }}/{{ statusSummary.running }}/{{ statusSummary.fail }}</strong>
          </div>
        </NSpin>
      </div>

      <div class="log-panel__actions">
        <NSelect v-model:value="logType" :options="typeOptions" class="log-panel__select" @update:value="loadLogs(true)" />
        <NInput
          v-model:value="keywords"
          clearable
          placeholder="搜索日志"
          class="log-panel__search"
          @keyup.enter="loadLogs(true)"
        >
          <template #prefix>
            <icon-ic-round-search class="text-icon" />
          </template>
        </NInput>
        <NButton @click="loadLogs(true)">查询</NButton>
      </div>
    </header>

    <NDataTable
      :loading="loading"
      :columns="columns"
      :data="logs"
      :row-key="row => row.id"
      size="small"
      remote
      :scroll-x="980"
      class="log-panel__table"
    />

    <footer v-if="total > 0" class="log-panel__pagination">
      <NPagination
        :page="page"
        :page-size="pageSize"
        :item-count="total"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </footer>

    <NModal v-model:show="detailVisible" preset="card" title="日志详情" class="w-760px max-w-94vw" :bordered="false">
      <NSpin :show="detailLoading">
        <pre class="log-panel__detail">{{ JSON.stringify(detailJson, null, 2) }}</pre>
      </NSpin>
    </NModal>
  </section>
</template>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-panel__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.log-panel__cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
  flex: 1;
}

.log-panel__card {
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid #eceef1;
  border-radius: 8px;
  background: #fff;
}

.log-panel__card p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
}

.log-panel__card strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
}

.log-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-panel__select {
  width: 140px;
}

.log-panel__search {
  width: 180px;
}

.log-panel__pagination {
  display: flex;
  justify-content: flex-end;
}

.log-panel__detail {
  margin: 0;
  max-height: 420px;
  overflow: auto;
  padding: 10px;
  border: 1px solid #eceef1;
  border-radius: 8px;
  background: #fafafa;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1360px) {
  .log-panel__toolbar {
    flex-direction: column;
  }

  .log-panel__cards {
    width: 100%;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .log-panel__actions {
    width: 100%;
  }
}
</style>
