<script setup lang="tsx">
import { computed, h, onMounted, ref } from 'vue';
import type { DataTableColumns, DropdownOption } from 'naive-ui';
import { NButton, NDropdown, NPopconfirm, NProgress, NSwitch } from 'naive-ui';
import { fetchDeleteDocuments, fetchDeleteKnowledgeBase, fetchDownloadDocument, fetchGetAiHubReadiness, fetchGetDocumentList, fetchGetKnowledgeBaseList, fetchParseDocuments, fetchStopParsing, fetchUpdateDocument, fetchUpdateDocumentStatus, fetchUpdateKnowledgeBase } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import KnowledgeOperateModal from './modules/knowledge-operate-modal.vue';
import KnowledgeUploadModal from './modules/knowledge-upload-modal.vue';

type DetailTab = 'file' | 'search' | 'log' | 'config';

const { hasAuth } = useAuth();

const listLoading = ref(false);
const list = ref<Api.Knowledge.KnowledgeBase[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const nameKeyword = ref('');
const statusFilter = ref<'all' | '1' | '2'>('all');

const aiReadiness = ref<Api.Knowledge.AiReadiness | null>(null);
const readinessLoading = ref(false);

const activeKnowledgeBase = ref<Api.Knowledge.KnowledgeBase | null>(null);
const activeDetailTab = ref<DetailTab>('file');

const docsLoading = ref(false);
const docs = ref<Api.Knowledge.Document[]>([]);
const docsPage = ref(1);
const docsPageSize = ref(10);
const docsTotal = ref(0);
const docsKeywords = ref('');
const checkedDocIds = ref<string[]>([]);

const createVisible = ref(false);
const uploadVisible = ref(false);

const renameVisible = ref(false);
const renameValue = ref('');
const renamingKnowledgeBase = ref<Api.Knowledge.KnowledgeBase | null>(null);
const renamingLoading = ref(false);

const renameDocumentVisible = ref(false);
const renameDocumentValue = ref('');
const renamingDocument = ref<Api.Knowledge.Document | null>(null);
const renamingDocumentLoading = ref(false);

const statusOptions: Array<{ label: string; key: 'all' | '1' | '2' }> = [
  { label: '全部', key: 'all' },
  { label: '启用', key: '1' },
  { label: '禁用', key: '2' }
];

const detailTabs: Array<{ key: DetailTab; label: string; icon: string }> = [
  { key: 'file', label: '文件列表', icon: 'solar:folder-with-files-linear' },
  { key: 'search', label: '检索测试', icon: 'solar:list-check-linear' },
  { key: 'log', label: '日志', icon: 'solar:list-linear' },
  { key: 'config', label: '配置', icon: 'solar:settings-linear' }
];

const parseMethodLabelMap: Record<string, string> = {
  naive: 'General',
  qa: 'Q&A',
  resume: 'Resume',
  manual: 'Manual',
  table: 'Table',
  paper: 'Paper',
  book: 'Book',
  laws: 'Laws',
  presentation: 'Presentation',
  one: 'One',
  tag: 'Tag',
  picture: 'Picture',
  audio: 'Audio',
  email: 'Email'
};

const runStateTextMap: Record<string, string> = {
  UNSTART: '待解析',
  RUNNING: '解析中',
  CANCEL: '已停止',
  DONE: '已完成',
  FAIL: '失败',
  SCHEDULE: '排队中'
};

const parseMethodOptions: DropdownOption[] = Object.entries(parseMethodLabelMap).map(([key, label]) => ({
  key,
  label
}));

const uploadLimitTip =
  '支持单次或批量上传。本地部署单次上传总大小上限 1GB，单次批量上传文件数不超过 32，单个账户不限文件数量。';

const canCreateKnowledgeBase = computed(
  () => hasAuth('knowledge:add') && aiReadiness.value?.status === 'READY'
);

const documentColumns = computed<DataTableColumns<Api.Knowledge.Document>>(() => [
  {
    type: 'selection',
    width: 48,
    align: 'center'
  },
  {
    key: 'name',
    title: '名称',
    minWidth: 260,
    ellipsis: { tooltip: true }
  },
  {
    key: 'createTime',
    title: '上传日期',
    minWidth: 180,
    render: row => formatDate(row.createTime || row.updateTime)
  },
  {
    key: 'status',
    title: '启用',
    width: 100,
    align: 'center',
    render: row =>
      h(NSwitch, {
        size: 'small',
        value: getDocumentEnabled(row),
        disabled: !hasAuth('knowledge:edit'),
        'onUpdate:value': (value: boolean) => handleUpdateDocumentStatus([row.id], value ? 1 : 0)
      })
  },
  {
    key: 'chunkNum',
    title: '分块数',
    width: 100,
    align: 'center',
    render: row => String(row.chunkNum ?? 0)
  },
  {
    key: 'meta',
    title: '元数据',
    width: 120,
    align: 'center',
    render: row => `${getDocumentMetaFieldCount(row)} fields`
  },
  {
    key: 'parser',
    title: '解析',
    width: 140,
    align: 'center',
    render: row =>
      h(
        NDropdown,
        {
          trigger: 'click',
          options: parseMethodOptions,
          disabled: !hasAuth('knowledge:edit'),
          onSelect: key => handleChangeDocumentParseMethod(row, String(key))
        },
        {
          default: () =>
            h(
              NButton,
              {
                text: true,
                size: 'small',
                class: 'doc-parser-btn'
              },
              { default: () => getParseMethodText(row) }
            )
        }
      )
  },
  {
    key: 'runStatus',
    title: '',
    width: 220,
    align: 'left',
    render: row => {
      const state = getRunState(row.run);
      const isRunning = state === 'RUNNING' || state === 'SCHEDULE';
      const percent = getProgressPercent(row.progress);
      const icon = getRunActionIcon(state);

      return h('div', { class: 'doc-run-cell', 'data-state': state.toLowerCase() }, [
        isRunning
          ? h(
              NButton,
              {
                text: true,
                class: 'doc-run-progress'
              },
              {
                default: () =>
                  h(NProgress, {
                    percentage: percent,
                    indicatorPlacement: 'inside',
                    showIndicator: false,
                    height: 6,
                    borderRadius: 4
                  })
              }
            )
          : null,
        h(
          NButton,
          {
            text: true,
            size: 'small',
            class: `doc-run-action doc-run-action--${state.toLowerCase()}`,
            disabled: !hasAuth('knowledge:add'),
            onClick: () => (isRunning ? handleStopDocuments([row.id]) : handleParseDocuments([row.id]))
          },
          {
            icon: () => h(SvgIcon, { icon }),
            default: () => (isRunning ? '停止' : '')
          }
        ),
        h('span', { class: 'doc-run-text' }, getRunStatusText(row.run))
      ]);
    }
  },
  {
    key: 'actions',
    title: '动作',
    width: 180,
    align: 'center',
    render: row =>
      h('div', { class: 'doc-actions' }, [
        h(
          NButton,
          {
            text: true,
            size: 'small',
            disabled: !hasAuth('knowledge:edit') || isDocumentRunning(row),
            onClick: () => handleOpenRenameDocument(row)
          },
          { icon: () => h(SvgIcon, { icon: 'lucide:pen-line' }) }
        ),
        h(
          NButton,
          {
            text: true,
            size: 'small',
            disabled: isDocumentRunning(row),
            onClick: () => handlePreviewDocument(row)
          },
          { icon: () => h(SvgIcon, { icon: 'lucide:eye' }) }
        ),
        h(
          NButton,
          {
            text: true,
            size: 'small',
            disabled: isDocumentRunning(row),
            onClick: () => handleDownloadDocument(row)
          },
          { icon: () => h(SvgIcon, { icon: 'lucide:download' }) }
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDeleteDocuments([row.id]) },
          {
            trigger: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'error',
                  size: 'small',
                  disabled: !hasAuth('knowledge:delete') || isDocumentRunning(row)
                },
                { icon: () => h(SvgIcon, { icon: 'lucide:trash-2' }) }
              ),
            default: () => '确认删除该文件吗？'
          }
        )
      ])
  }
]);

function getCardMenuOptions() {
  const options: DropdownOption[] = [];

  if (hasAuth('knowledge:edit')) {
    options.push({
      label: '重命名',
      key: 'rename'
    });
  }

  if (hasAuth('knowledge:delete')) {
    options.push({
      label: '删除',
      key: 'delete'
    });
  }

  return options;
}

function getDocumentCount(kb: Api.Knowledge.KnowledgeBase) {
  const docCount = (kb as any).documentCount ?? (kb as any).document_count ?? (kb as any).docNum ?? (kb as any).doc_num;

  return typeof docCount === 'number' ? docCount : 0;
}

function getDatasetInitial(name: string) {
  const text = (name || '').trim();
  return text ? text[0].toUpperCase() : 'K';
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 19).replace('T', ' ');
  }
  const pad = (num: number) => `${num}`.padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getRunStatusText(run?: string) {
  return runStateTextMap[getRunState(run)] || '待解析';
}

function getRunState(run?: string) {
  const value = String(run ?? '').toUpperCase();
  if (value === '1' || value === 'RUNNING') return 'RUNNING';
  if (value === '2' || value === 'CANCEL') return 'CANCEL';
  if (value === '3' || value === 'DONE') return 'DONE';
  if (value === '4' || value === 'FAIL') return 'FAIL';
  if (value === '5' || value === 'SCHEDULE') return 'SCHEDULE';
  return 'UNSTART';
}

function getRunActionIcon(state: string) {
  if (state === 'RUNNING' || state === 'SCHEDULE') return 'lucide:circle-x';
  if (state === 'UNSTART') return 'lucide:play';
  return 'lucide:rotate-cw';
}

function getProgressPercent(progress?: number) {
  const value = Number(progress ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value <= 1) return Math.min(100, Math.round(value * 100));
  return Math.min(100, Math.round(value));
}

function isDocumentRunning(row: Api.Knowledge.Document) {
  const state = getRunState(row.run);
  return state === 'RUNNING' || state === 'SCHEDULE';
}

function getDocumentEnabled(row: Api.Knowledge.Document) {
  return String(row.status ?? '1') === '1';
}

function getDocumentMetaFieldCount(row: Api.Knowledge.Document) {
  const metaFields = (row.metaFields ?? (row as any).meta_fields ?? {}) as Record<string, unknown>;
  if (!metaFields || typeof metaFields !== 'object') return 0;
  return Object.keys(metaFields).length;
}

function getParseMethodText(row: Api.Knowledge.Document) {
  const pipelineId = String((row as any).pipelineId ?? (row as any).pipeline_id ?? '').trim();
  const pipelineName = String((row as any).pipelineName ?? (row as any).pipeline_name ?? '').trim();
  if (pipelineId) return pipelineName || pipelineId;

  const method = String(
    (row as any).parseMethod ??
      (row as any).chunkMethod ??
      (row as any).chunk_method ??
      activeKnowledgeBase.value?.chunkMethod ??
      ''
  )
    .trim()
    .toLowerCase();

  if (!method) return '-';
  return parseMethodLabelMap[method] || method;
}

function normalizeDocument(document: any): Api.Knowledge.Document {
  const runValue = String(document?.run ?? document?.run_status ?? 'UNSTART').toUpperCase();
  const normalized = {
    id: String(document?.id || ''),
    name: document?.name || '-',
    datasetId: document?.datasetId ?? document?.dataset_id ?? undefined,
    type: document?.type ?? undefined,
    size: typeof document?.size === 'number' ? document.size : undefined,
    chunkNum: Number(document?.chunkNum ?? document?.chunk_num ?? document?.chunk_count ?? 0),
    tokenNum: Number(document?.tokenNum ?? document?.token_num ?? document?.token_count ?? 0),
    progress: typeof document?.progress === 'number' ? document.progress : Number(document?.progress ?? 0),
    run: runValue,
    status: String(document?.status ?? '1'),
    pipelineId: document?.pipelineId ?? document?.pipeline_id ?? null,
    pipelineName: document?.pipelineName ?? document?.pipeline_name ?? null,
    parserConfig: document?.parserConfig ?? document?.parser_config ?? null,
    metaFields: document?.metaFields ?? document?.meta_fields ?? {},
    createTime: document?.createTime ?? document?.create_time ?? document?.created_at,
    updateTime: document?.updateTime ?? document?.update_time ?? document?.updated_at
  };

  (normalized as any).chunkMethod = document?.chunkMethod ?? document?.chunk_method ?? null;
  (normalized as any).chunk_method = document?.chunkMethod ?? document?.chunk_method ?? null;
  (normalized as any).parseMethod = document?.chunkMethod ?? document?.chunk_method ?? null;
  (normalized as any).pipeline_id = document?.pipelineId ?? document?.pipeline_id ?? null;
  (normalized as any).pipeline_name = document?.pipelineName ?? document?.pipeline_name ?? null;
  (normalized as any).meta_fields = document?.metaFields ?? document?.meta_fields ?? {};

  return normalized;
}

async function loadAiReadiness() {
  readinessLoading.value = true;
  try {
    const { error, data } = await fetchGetAiHubReadiness();
    if (!error) {
      aiReadiness.value = data;
    }
  } finally {
    readinessLoading.value = false;
  }
}

async function loadKnowledgeBaseList(resetPage = false) {
  if (resetPage) {
    page.value = 1;
  }

  listLoading.value = true;
  try {
    const { error, data } = await fetchGetKnowledgeBaseList({
      current: page.value,
      size: pageSize.value,
      name: nameKeyword.value || null,
      status: statusFilter.value === 'all' ? null : statusFilter.value
    });
    if (error || !data) return;

    list.value = data.records || [];
    total.value = data.total || 0;
    page.value = data.current || page.value;
    pageSize.value = data.size || pageSize.value;
  } finally {
    listLoading.value = false;
  }
}

async function loadDocuments(resetPage = false) {
  if (!activeKnowledgeBase.value) return;
  if (resetPage) {
    docsPage.value = 1;
  }

  docsLoading.value = true;
  try {
    const { error, data } = await fetchGetDocumentList(activeKnowledgeBase.value.id, {
      current: docsPage.value,
      size: docsPageSize.value,
      keywords: docsKeywords.value || undefined
    });
    if (error || !data) return;

    docs.value = (data.records || []).map(normalizeDocument);
    docsTotal.value = data.total || 0;
    docsPage.value = data.current || docsPage.value;
    docsPageSize.value = data.size || docsPageSize.value;
  } finally {
    docsLoading.value = false;
  }
}

async function handleCreateKnowledgeBase() {
  if (!hasAuth('knowledge:add')) {
    window.$message?.warning('当前账号没有创建知识库权限');
    return;
  }

  if (!aiReadiness.value) {
    await loadAiReadiness();
  }

  if (aiReadiness.value?.status !== 'READY') {
    window.$message?.warning('请先完成模型配置后再创建知识库');
    return;
  }

  createVisible.value = true;
}

function handleStatusSelect(key: string | number) {
  statusFilter.value = String(key) as 'all' | '1' | '2';
  loadKnowledgeBaseList(true);
}

function handleEnterKnowledgeBase(item: Api.Knowledge.KnowledgeBase) {
  activeKnowledgeBase.value = item;
  activeDetailTab.value = 'file';
  docsKeywords.value = '';
  checkedDocIds.value = [];
  loadDocuments(true);
}

function handleBackToList() {
  activeKnowledgeBase.value = null;
  checkedDocIds.value = [];
}

async function handleCardMenuSelect(key: string, item: Api.Knowledge.KnowledgeBase) {
  if (key === 'rename') {
    renamingKnowledgeBase.value = item;
    renameValue.value = item.name;
    renameVisible.value = true;
    return;
  }

  if (key === 'delete') {
    await handleDeleteKnowledgeBase(item);
  }
}

async function handleDeleteKnowledgeBase(item: Api.Knowledge.KnowledgeBase) {
  if (!hasAuth('knowledge:delete')) {
    window.$message?.warning('当前账号没有删除知识库权限');
    return;
  }

  const { error } = await fetchDeleteKnowledgeBase(item.id);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  if (activeKnowledgeBase.value?.id === item.id) {
    activeKnowledgeBase.value = null;
  }
  await loadKnowledgeBaseList();
}

async function handleSubmitRename() {
  const kb = renamingKnowledgeBase.value;
  const nextName = renameValue.value.trim();

  if (!kb || !nextName) {
    window.$message?.warning('请输入知识库名称');
    return;
  }

  renamingLoading.value = true;
  try {
    const { error } = await fetchUpdateKnowledgeBase(kb.id, { name: nextName });
    if (error) return;

    window.$message?.success('重命名成功');
    renameVisible.value = false;

    if (activeKnowledgeBase.value?.id === kb.id) {
      activeKnowledgeBase.value = { ...activeKnowledgeBase.value, name: nextName };
    }
    await loadKnowledgeBaseList();
  } finally {
    renamingLoading.value = false;
  }
}

async function handleParseDocuments(ids: string[]) {
  if (!activeKnowledgeBase.value || !ids.length) return;
  const { error } = await fetchParseDocuments(activeKnowledgeBase.value.id, ids);
  if (error) return;
  window.$message?.success('已提交解析任务');
  await loadDocuments();
}

async function handleStopDocuments(ids: string[]) {
  if (!activeKnowledgeBase.value || !ids.length) return;
  const { error } = await fetchStopParsing(activeKnowledgeBase.value.id, ids);
  if (error) return;
  window.$message?.success('已停止解析任务');
  await loadDocuments();
}

async function handleUpdateDocumentStatus(docIds: string[], status: 0 | 1) {
  if (!activeKnowledgeBase.value || !docIds.length) return;
  const { error } = await fetchUpdateDocumentStatus(activeKnowledgeBase.value.id, docIds, status);
  if (error) return;
  await loadDocuments();
}

async function handleChangeDocumentParseMethod(row: Api.Knowledge.Document, method: string) {
  if (!activeKnowledgeBase.value) return;
  const nextMethod = method.trim().toLowerCase();
  if (!nextMethod) return;
  if ((row.chunkMethod || '').toLowerCase() === nextMethod) return;

  const { error } = await fetchUpdateDocument(activeKnowledgeBase.value.id, row.id, { chunkMethod: nextMethod });
  if (error) return;
  window.$message?.success('解析方式已更新');
  await loadDocuments();
}

function handleOpenRenameDocument(row: Api.Knowledge.Document) {
  renamingDocument.value = row;
  renameDocumentValue.value = row.name;
  renameDocumentVisible.value = true;
}

async function handleSubmitRenameDocument() {
  const record = renamingDocument.value;
  const nextName = renameDocumentValue.value.trim();
  if (!activeKnowledgeBase.value || !record || !nextName) {
    window.$message?.warning('请输入文件名称');
    return;
  }

  renamingDocumentLoading.value = true;
  try {
    const { error } = await fetchUpdateDocument(activeKnowledgeBase.value.id, record.id, { name: nextName });
    if (error) return;
    renameDocumentVisible.value = false;
    window.$message?.success('重命名成功');
    await loadDocuments();
  } finally {
    renamingDocumentLoading.value = false;
  }
}

function handlePreviewDocument(row: Api.Knowledge.Document) {
  const runText = getRunStatusText(row.run);
  const parseText = getParseMethodText(row);
  window.$dialog?.info({
    title: '文件详情',
    content: `名称：${row.name}\n解析：${parseText}\n状态：${runText}\n分块：${row.chunkNum || 0}\n更新时间：${formatDate(row.updateTime)}`
  });
}

function getFileExt(name: string) {
  const index = name.lastIndexOf('.');
  if (index < 0 || index === name.length - 1) return undefined;
  return name.slice(index + 1).toLowerCase();
}

async function handleDownloadDocument(row: Api.Knowledge.Document) {
  if (!activeKnowledgeBase.value) return;
  try {
    const { blob, filename } = await fetchDownloadDocument(activeKnowledgeBase.value.id, row.id, getFileExt(row.name));
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || row.name || 'document';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : '下载失败');
  }
}

async function handleDeleteDocuments(ids: string[]) {
  if (!activeKnowledgeBase.value || !ids.length) return;
  const { error } = await fetchDeleteDocuments(activeKnowledgeBase.value.id, ids);
  if (error) return;
  checkedDocIds.value = [];
  window.$message?.success('删除成功');
  await Promise.all([loadDocuments(), loadKnowledgeBaseList()]);
}

function handleDetailTabChange(tab: DetailTab) {
  activeDetailTab.value = tab;
  if (tab !== 'file') {
    window.$message?.info('该能力按官方顺序后续接入');
  }
}

function handleCreateFile() {
  if (!hasAuth('knowledge:add')) {
    window.$message?.warning('当前账号没有新增文件权限');
    return;
  }
  uploadVisible.value = true;
}

function handleCreateSubmitted() {
  createVisible.value = false;
  loadKnowledgeBaseList(true);
}

function handleUploadSubmitted() {
  uploadVisible.value = false;
  loadDocuments(true);
  loadKnowledgeBaseList();
}

onMounted(async () => {
  await Promise.all([loadAiReadiness(), loadKnowledgeBaseList(true)]);
});
</script>

<template>
  <div class="knowledge-page">
    <template v-if="!activeKnowledgeBase">
      <section class="knowledge-page__list-header">
        <div>
          <h2 class="knowledge-page__title">知识库</h2>
        </div>
        <div class="knowledge-page__list-actions">
          <NDropdown
            trigger="click"
            :options="statusOptions"
            @select="handleStatusSelect"
          >
            <NButton quaternary square>
              <template #icon>
                <icon-mdi-filter-outline />
              </template>
            </NButton>
          </NDropdown>
          <NInput
            v-model:value="nameKeyword"
            clearable
            placeholder="搜索"
            class="knowledge-page__search"
            @keyup.enter="loadKnowledgeBaseList(true)"
          >
            <template #prefix>
              <icon-ic-round-search class="text-icon" />
            </template>
          </NInput>
          <NButton
            type="primary"
            :disabled="!canCreateKnowledgeBase"
            :loading="readinessLoading"
            @click="handleCreateKnowledgeBase"
          >
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            创建知识库
          </NButton>
        </div>
      </section>

      <NSpin :show="listLoading">
        <section v-if="list.length" class="knowledge-page__card-grid">
          <article
            v-for="item in list"
            :key="item.id"
            class="knowledge-card"
            role="button"
            tabindex="0"
            @click="handleEnterKnowledgeBase(item)"
            @keydown.enter="handleEnterKnowledgeBase(item)"
          >
            <span class="knowledge-card__avatar">{{ getDatasetInitial(item.name) }}</span>
            <div class="knowledge-card__content">
              <div class="knowledge-card__top">
                <h3 class="knowledge-card__title">{{ item.name }}</h3>
                <NDropdown
                  trigger="click"
                  :options="getCardMenuOptions()"
                  @select="key => handleCardMenuSelect(String(key), item)"
                >
                  <NButton text class="knowledge-card__more" @click.stop>
                    <icon-mdi-dots-horizontal />
                  </NButton>
                </NDropdown>
              </div>
              <p class="knowledge-card__meta">{{ getDocumentCount(item) }} 个文件</p>
              <p class="knowledge-card__time">{{ formatDate(item.updateTime) }}</p>
            </div>
          </article>
        </section>

        <section v-else class="knowledge-page__empty">
          <NEmpty description="尚未创建知识库" />
        </section>
      </NSpin>

      <footer class="knowledge-page__pagination" v-if="total > 0">
        <NPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="total"
          show-size-picker
          :page-sizes="[10, 20, 50]"
          @update:page="loadKnowledgeBaseList()"
          @update:page-size="loadKnowledgeBaseList(true)"
        />
      </footer>
    </template>

    <template v-else>
      <section class="knowledge-detail">
        <aside class="knowledge-detail__sidebar">
          <NButton text class="knowledge-detail__back" @click="handleBackToList">
            <template #icon>
              <icon-mdi-arrow-left />
            </template>
            返回知识库
          </NButton>

          <div class="knowledge-detail__kb-info">
            <span class="knowledge-detail__avatar">{{ getDatasetInitial(activeKnowledgeBase.name) }}</span>
            <div class="knowledge-detail__kb-main">
              <p class="knowledge-detail__kb-name">{{ activeKnowledgeBase.name }}</p>
              <p class="knowledge-detail__kb-meta">{{ getDocumentCount(activeKnowledgeBase) }} 个文件</p>
              <p class="knowledge-detail__kb-meta">创建于 {{ formatDate(activeKnowledgeBase.createTime) }}</p>
            </div>
          </div>

          <div class="knowledge-detail__tabs">
            <button
              v-for="tab in detailTabs"
              :key="tab.key"
              class="knowledge-detail__tab"
              :class="{ 'knowledge-detail__tab--active': activeDetailTab === tab.key }"
              type="button"
              @click="handleDetailTabChange(tab.key)"
            >
              <SvgIcon :icon="tab.icon" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </aside>

        <main class="knowledge-detail__main">
          <template v-if="activeDetailTab === 'file'">
            <header class="knowledge-detail__toolbar">
              <div>
                <h3 class="knowledge-detail__main-title">文件列表</h3>
                <p class="knowledge-detail__main-desc">解析成功后才能问答哦。</p>
              </div>
              <div class="knowledge-detail__toolbar-actions">
                <NInput
                  v-model:value="docsKeywords"
                  clearable
                  class="knowledge-detail__search"
                  placeholder="搜索"
                  @keyup.enter="loadDocuments(true)"
                >
                  <template #prefix>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                </NInput>
                <NButton type="primary" @click="handleCreateFile">
                  <template #icon>
                    <icon-ic-round-plus class="text-icon" />
                  </template>
                  新增文件
                </NButton>
              </div>
            </header>

            <section class="knowledge-detail__batch-actions">
              <NButton :disabled="!checkedDocIds.length" @click="handleParseDocuments(checkedDocIds)">批量解析</NButton>
              <NButton :disabled="!checkedDocIds.length" @click="handleStopDocuments(checkedDocIds)">停止解析</NButton>
              <NPopconfirm :disabled="!checkedDocIds.length" @positive-click="handleDeleteDocuments(checkedDocIds)">
                <template #trigger>
                  <NButton type="error" :disabled="!checkedDocIds.length">批量删除</NButton>
                </template>
                确认删除选中文件吗？
              </NPopconfirm>
            </section>

            <NDataTable
              v-model:checked-row-keys="checkedDocIds"
              :loading="docsLoading"
              :columns="documentColumns"
              :data="docs"
              :row-key="row => row.id"
              size="small"
              remote
              :scroll-x="1280"
              class="knowledge-detail__table"
            />

            <footer class="knowledge-page__pagination">
              <NPagination
                v-model:page="docsPage"
                v-model:page-size="docsPageSize"
                :item-count="docsTotal"
                show-size-picker
                :page-sizes="[10, 20, 50]"
                @update:page="loadDocuments()"
                @update:page-size="loadDocuments(true)"
              />
            </footer>
          </template>

          <section v-else class="knowledge-detail__placeholder">
            <NText depth="3">该模块按官方顺序后续接入。</NText>
          </section>
        </main>
      </section>
    </template>

    <KnowledgeOperateModal
      v-model:visible="createVisible"
      operate-type="add"
      @submitted="handleCreateSubmitted"
    />

    <KnowledgeUploadModal
      v-model:visible="uploadVisible"
      :knowledge-base="activeKnowledgeBase"
      :limit-tip="uploadLimitTip"
      @uploaded="handleUploadSubmitted"
    />

    <NModal v-model:show="renameVisible" preset="card" title="重命名" class="w-540px max-w-90vw" :bordered="false">
      <NForm label-placement="top">
        <NFormItem label="名称">
          <NInput v-model:value="renameValue" maxlength="128" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="renameVisible = false">取消</NButton>
          <NButton type="primary" :loading="renamingLoading" @click="handleSubmitRename">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="renameDocumentVisible"
      preset="card"
      title="重命名文件"
      class="w-540px max-w-90vw"
      :bordered="false"
    >
      <NForm label-placement="top">
        <NFormItem label="名称">
          <NInput v-model:value="renameDocumentValue" maxlength="255" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="renameDocumentVisible = false">取消</NButton>
          <NButton type="primary" :loading="renamingDocumentLoading" @click="handleSubmitRenameDocument">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.knowledge-page {
  min-height: 100%;
  padding: 16px 18px 20px;
  color: #111827;
  background: #fff;
}

.knowledge-page__list-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.knowledge-page__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0;
}

.knowledge-page__list-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.knowledge-page__search {
  width: 184px;
}

.knowledge-page__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.knowledge-card {
  min-height: 164px;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.knowledge-card:hover,
.knowledge-card:focus-visible {
  border-color: #18c8c6;
  outline: none;
}

.knowledge-card__avatar {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #7f56d9 0%, #b692f6 100%);
  font-size: 34px;
  line-height: 1;
}

.knowledge-card__content {
  min-width: 0;
}

.knowledge-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.knowledge-card__title {
  margin: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-card__more {
  margin-top: 2px;
  font-size: 22px;
}

.knowledge-card__meta,
.knowledge-card__time {
  margin: 8px 0 0;
  color: #111827;
  font-size: 14px;
  line-height: 1.4;
}

.knowledge-card__time {
  margin-top: 6px;
  font-size: 13px;
}

.knowledge-page__empty {
  min-height: 280px;
  display: grid;
  place-items: center;
}

.knowledge-page__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.knowledge-detail {
  min-height: calc(100vh - 130px);
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
}

.knowledge-detail__sidebar {
  padding: 10px 8px 10px 2px;
}

.knowledge-detail__back {
  margin-bottom: 12px;
  padding: 0;
  font-size: 14px;
}

.knowledge-detail__kb-info {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.knowledge-detail__avatar {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #7f56d9 0%, #b692f6 100%);
  font-size: 38px;
  line-height: 1;
}

.knowledge-detail__kb-main {
  min-width: 0;
}

.knowledge-detail__kb-name {
  margin: 2px 0 4px;
  overflow: hidden;
  font-size: 20px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-detail__kb-meta {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.45;
}

.knowledge-detail__tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.knowledge-detail__tab {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  color: #4b5563;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.knowledge-detail__tab:hover,
.knowledge-detail__tab--active {
  color: #111827;
  background: #f3f4f6;
}

.knowledge-detail__main {
  min-width: 0;
  border: 1px solid #eceef1;
  border-radius: 12px;
  padding: 14px 14px 12px;
  background: #fff;
}

.knowledge-detail__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.knowledge-detail__main-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.knowledge-detail__main-desc {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.knowledge-detail__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.knowledge-detail__search {
  width: 162px;
}

.knowledge-detail__batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.knowledge-detail__table {
  min-height: 440px;
}

.knowledge-detail__placeholder {
  min-height: 360px;
  display: grid;
  place-items: center;
}

.doc-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.doc-parser-btn {
  text-transform: none;
}

.doc-run-cell {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.doc-run-progress {
  min-width: 72px;
}

.doc-run-text {
  color: #6b7280;
  font-size: 12px;
}

.doc-run-action {
  padding: 0 2px;
  font-size: 16px;
}

.doc-run-action--unstart {
  color: #10b981;
}

.doc-run-action--done,
.doc-run-action--cancel,
.doc-run-action--fail {
  color: #14b8a6;
}

.doc-run-action--running,
.doc-run-action--schedule {
  color: #ef4444;
}

@media (max-width: 1200px) {
  .knowledge-detail {
    grid-template-columns: minmax(0, 1fr);
  }

  .knowledge-detail__sidebar {
    border-bottom: 1px solid #eceef1;
    padding-bottom: 14px;
  }

  .knowledge-detail__tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .knowledge-page {
    padding: 12px;
  }

  .knowledge-page__list-header {
    align-items: stretch;
    flex-direction: column;
  }

  .knowledge-page__list-actions {
    flex-wrap: wrap;
  }

  .knowledge-page__search,
  .knowledge-detail__search {
    width: 100%;
  }

  .knowledge-page__card-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .knowledge-detail__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .knowledge-detail__toolbar-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
