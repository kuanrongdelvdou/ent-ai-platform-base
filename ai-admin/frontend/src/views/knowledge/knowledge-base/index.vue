<script setup lang="tsx">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DataTableColumns, DropdownOption } from 'naive-ui';
import { NButton, NDropdown, NPopconfirm, NPopover, NProgress, NSwitch } from 'naive-ui';
import {
  fetchCreateEmptyDocument,
  fetchDeleteDocuments,
  fetchDeleteKnowledgeBase,
  fetchDownloadDocument,
  fetchGetAiHubReadiness,
  fetchGetDocumentFilters,
  fetchGetDocumentList,
  fetchGetKnowledgeBaseList,
  fetchPreviewDocument,
  fetchRunDocuments,
  fetchUpdateDocument,
  fetchUpdateDocumentStatus,
  fetchUpdateKnowledgeBase
} from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import SvgIcon from '@/components/custom/svg-icon.vue';
import KnowledgeConfigPanel from './modules/knowledge-config-panel.vue';
import KnowledgeLogPanel from './modules/knowledge-log-panel.vue';
import KnowledgeOperateModal from './modules/knowledge-operate-modal.vue';
import KnowledgeSearchPanel from './modules/knowledge-search-panel.vue';
import KnowledgeUploadModal from './modules/knowledge-upload-modal.vue';

type DetailTab = 'file' | 'search' | 'log' | 'config';
const EMPTY_METADATA_FIELD = 'empty_metadata';

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

const docFilterLoading = ref(false);
const docFilter = ref<Api.Knowledge.DocumentFilters['filter'] | null>(null);
const selectedRunFilters = ref<string[]>([]);
const selectedSuffixFilters = ref<string[]>([]);
const pendingRunFilters = ref<string[]>([]);
const pendingSuffixFilters = ref<string[]>([]);
const selectedMetadataFilters = ref<Record<string, string[]>>({});
const pendingMetadataFilters = ref<Record<string, string[]>>({});
const includeEmptyMetadata = ref(false);
const pendingIncludeEmptyMetadata = ref(false);
const docFilterPopoverVisible = ref(false);

const createVisible = ref(false);
const uploadVisible = ref(false);
const emptyVisible = ref(false);
const emptyName = ref('');
const emptyLoading = ref(false);

const renameVisible = ref(false);
const renameValue = ref('');
const renamingKnowledgeBase = ref<Api.Knowledge.KnowledgeBase | null>(null);
const renamingLoading = ref(false);

const renameDocumentVisible = ref(false);
const renameDocumentValue = ref('');
const renamingDocument = ref<Api.Knowledge.Document | null>(null);
const renamingDocumentLoading = ref(false);

const reparseVisible = ref(false);
const reparseLoading = ref(false);
const reparseTarget = ref<Api.Knowledge.Document | null>(null);
const reparseDelete = ref(true);
const reparseApplyKb = ref(false);
const metadataVisible = ref(false);
const metadataTarget = ref<Api.Knowledge.Document | null>(null);

const DOC_LIST_POLL_INTERVAL = 5000;
let docsPollingTimer: number | null = null;

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
  email: 'Email',
  knowledge_graph: 'Knowledge Graph'
};

const runStateTextMap: Record<string, string> = {
  UNSTART: '待解析',
  RUNNING: '解析中',
  CANCEL: '已停止',
  DONE: '已完成',
  FAIL: '失败',
  SCHEDULE: '排队中'
};

const runStateColorMap: Record<string, string> = {
  UNSTART: 'var(--n-primary-color)',
  RUNNING: '#14b8a6',
  CANCEL: '#f59e0b',
  DONE: '#22c55e',
  FAIL: '#ef4444',
  SCHEDULE: '#14b8a6'
};

const parseMethodOptions: DropdownOption[] = Object.entries(parseMethodLabelMap).map(([key, label]) => ({
  key,
  label
}));

const addFileOptions: DropdownOption[] = [
  { key: 'upload', label: '上传文件' },
  { key: 'empty', label: '新增空白文件' }
];

const uploadLimitTip =
  '支持单次或批量上传。本地部署的单次上传文件总大小上限为 1GB，单次批量上传文件数不超过 32，单个账户不限文件数量。对于 cloud.ragflow.io：每次上传的总文件大小限制为 10MB，每个文件不得超过 10MB，每个账户最多可上传 128 个文件。严禁上传违禁文件。';

const canCreateKnowledgeBase = computed(
  () => hasAuth('knowledge:add') && aiReadiness.value?.status === 'READY'
);

function hasMetadataFilterValue(source: Record<string, string[]>) {
  return Object.values(source).some(values => Array.isArray(values) && values.length > 0);
}

function cloneMetadataFilters(source: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(source).map(([field, values]) => [field, Array.isArray(values) ? [...values] : []])
  );
}

const hasDocumentFilter = computed(() => {
  return (
    selectedRunFilters.value.length > 0 ||
    selectedSuffixFilters.value.length > 0 ||
    includeEmptyMetadata.value ||
    hasMetadataFilterValue(selectedMetadataFilters.value)
  );
});

const runFilterOptions = computed(() => {
  const source = docFilter.value?.run_status ?? {};
  return Object.entries(source).map(([key, count]) => ({
    key,
    label: `${getRunStatusText(key)} (${count})`
  }));
});

const suffixFilterOptions = computed(() => {
  const source = docFilter.value?.suffix ?? {};
  return Object.entries(source).map(([key, count]) => ({
    key,
    label: `${key} (${count})`
  }));
});

const metadataFilterOptions = computed(() => {
  const source = docFilter.value?.metadata ?? {};
  return Object.entries(source)
    .filter(([field]) => field !== EMPTY_METADATA_FIELD)
    .map(([field, valueMap]) => {
      const entries = Object.entries(valueMap ?? {});
      const totalCount = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0);
      return {
        field,
        totalCount,
        options: entries.map(([value, count]) => ({
          value,
          label: `${value} (${count})`
        }))
      };
    });
});

const emptyMetadataCount = computed(() => {
  const source = docFilter.value?.metadata?.[EMPTY_METADATA_FIELD] as Record<string, number> | undefined;
  return Number(source?.true ?? 0);
});

const showReparseDelete = computed(() => Number(reparseTarget.value?.chunkNum ?? 0) > 0);
const showReparseApplyKb = computed(() => Boolean((reparseTarget.value?.parserConfig as any)?.enable_metadata));

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
    ellipsis: { tooltip: true },
    render: row =>
      h(
        'button',
        {
          type: 'button',
          class: 'doc-name-btn',
          onClick: () => handlePreviewDocument(row)
        },
        [
          h(SvgIcon, { icon: 'lucide:file-text', class: 'doc-name-icon' }),
          h('span', { class: 'doc-name-text' }, row.name)
        ]
      )
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
    render: row =>
      h(
        NButton,
        {
          text: true,
          size: 'small',
          class: 'doc-meta-btn',
          onClick: () => handleOpenMetadata(row)
        },
        { default: () => `${getDocumentMetaFieldCount(row)} fields` }
      )
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
          disabled: !hasAuth('knowledge:edit') || isDocumentRunning(row),
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
    width: 180,
    align: 'left',
    render: row => {
      const state = getRunState(row.run);
      const isRunning = state === 'RUNNING' || state === 'SCHEDULE';
      const percent = getProgressPercent(row.progress);
      const icon = getRunActionIcon(state);
      const hasLog =
        Boolean((row as any).progressMsg || (row as any).progress_msg) ||
        Boolean((row as any).processBeginAt || (row as any).process_begin_at) ||
        Number((row as any).processDuration ?? (row as any).process_duration ?? 0) > 0;
      const dotStyle = {
        backgroundColor: getRunStatusColor(row.run)
      };

      return h('div', { class: 'doc-run-cell', 'data-state': state.toLowerCase() }, [
        h('span', { class: 'doc-run-separator' }),
        isRunning
          ? h('div', { class: 'doc-run-progress' }, [
              h(NProgress, {
                percentage: percent,
                indicatorPlacement: 'inside',
                showIndicator: false,
                height: 6,
                borderRadius: 4
              }),
              h('span', { class: 'doc-run-progress-text' }, `${percent}%`)
            ])
          : null,
        h(
          NButton,
          {
            text: true,
            size: 'small',
            class: `doc-run-action doc-run-action--${state.toLowerCase()}`,
            disabled: !hasAuth('knowledge:add'),
            onClick: () => handleRunActionClick(row)
          },
          {
            icon: () => h(SvgIcon, { icon }),
            default: () => (isRunning ? '停止' : '')
          }
        ),
        h(
          NPopover,
          {
            trigger: 'hover',
            placement: 'left',
            disabled: !hasLog
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  text: true,
                  size: 'small',
                  class: 'doc-run-dot-btn',
                  disabled: !hasLog
                },
                {
                  default: () => h('span', { class: 'doc-run-dot', style: dotStyle })
                }
              ),
            default: () => renderRunLogPopover(row)
          }
        )
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
            disabled: isDocumentRunning(row) || isVirtualDocument(row),
            onClick: () => handlePreviewDocument(row)
          },
          { icon: () => h(SvgIcon, { icon: 'lucide:eye' }) }
        ),
        h(
          NButton,
          {
            text: true,
            size: 'small',
            disabled: isDocumentRunning(row) || isVirtualDocument(row),
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
  if (hasAuth('knowledge:edit')) options.push({ label: '重命名', key: 'rename' });
  if (hasAuth('knowledge:delete')) options.push({ label: '删除', key: 'delete' });
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

function getRunState(run?: string) {
  const value = String(run ?? '').toUpperCase();
  if (value === '1' || value === 'RUNNING') return 'RUNNING';
  if (value === '2' || value === 'CANCEL') return 'CANCEL';
  if (value === '3' || value === 'DONE') return 'DONE';
  if (value === '4' || value === 'FAIL') return 'FAIL';
  if (value === '5' || value === 'SCHEDULE') return 'SCHEDULE';
  return 'UNSTART';
}

function getRunStatusText(run?: string) {
  return runStateTextMap[getRunState(run)] || '待解析';
}

function getRunStatusColor(run?: string) {
  const state = getRunState(run);
  return runStateColorMap[state] || 'var(--n-primary-color)';
}

function getRunActionIcon(state: string) {
  if (state === 'RUNNING' || state === 'SCHEDULE') return 'lucide:circle-x';
  if (state === 'UNSTART') return 'lucide:play';
  return 'lucide:rotate-cw';
}

function getProcessDurationText(row: Api.Knowledge.Document) {
  const value = Number((row as any).processDuration ?? (row as any).process_duration ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '-';
  return `${value.toFixed(2)} s`;
}

function normalizeProgressMessage(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item ?? '').trim())
      .filter(Boolean)
      .join('\n');
  }
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function renderRunLogPopover(row: Api.Knowledge.Document) {
  const message = normalizeProgressMessage((row as any).progressMsg ?? (row as any).progress_msg) || '-';
  const statusText = getRunStatusText(row.run);
  const beginTime = formatDate((row as any).processBeginAt ?? (row as any).process_begin_at ?? row.createTime);

  return h('section', { class: 'doc-log-popover' }, [
    h('div', { class: 'doc-log-popover__status' }, [
      h('span', {
        class: 'doc-log-popover__dot',
        style: { backgroundColor: getRunStatusColor(row.run) }
      }),
      h('span', null, statusText)
    ]),
    h('div', { class: 'doc-log-popover__line' }, [h('b', null, '开始时间:'), h('span', null, beginTime)]),
    h('div', { class: 'doc-log-popover__line' }, [h('b', null, '耗时:'), h('span', null, getProcessDurationText(row))]),
    h('div', { class: 'doc-log-popover__line doc-log-popover__line--block' }, [
      h('b', null, '日志:'),
      h('pre', { class: 'doc-log-popover__message' }, message)
    ])
  ]);
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

function isVirtualDocument(row: Api.Knowledge.Document) {
  return String(row.type ?? '').toLowerCase() === 'virtual';
}

function getDocumentEnabled(row: Api.Knowledge.Document) {
  return String(row.status ?? '1') === '1';
}

function getDocumentMetaFieldCount(row: Api.Knowledge.Document) {
  const metaFields = (row.metaFields ?? (row as any).meta_fields ?? {}) as Record<string, unknown>;
  return metaFields && typeof metaFields === 'object' ? Object.keys(metaFields).length : 0;
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
    suffix: document?.suffix ?? undefined,
    nickname: document?.nickname ?? undefined,
    chunkNum: Number(document?.chunkNum ?? document?.chunk_num ?? document?.chunk_count ?? 0),
    tokenNum: Number(document?.tokenNum ?? document?.token_num ?? document?.token_count ?? 0),
    progress: typeof document?.progress === 'number' ? document.progress : Number(document?.progress ?? 0),
    progressMsg: document?.progressMsg ?? document?.progress_msg ?? '',
    processBeginAt: document?.processBeginAt ?? document?.process_begin_at ?? '',
    processDuration: Number(document?.processDuration ?? document?.process_duration ?? document?.process_duation ?? 0),
    createDate: document?.createDate ?? document?.create_date ?? '',
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
  (normalized as any).progress_msg = document?.progressMsg ?? document?.progress_msg ?? '';
  (normalized as any).process_begin_at = document?.processBeginAt ?? document?.process_begin_at ?? '';
  (normalized as any).process_duration = Number(
    document?.processDuration ?? document?.process_duration ?? document?.process_duation ?? 0
  );

  return normalized;
}

async function loadAiReadiness() {
  readinessLoading.value = true;
  try {
    const { error, data } = await fetchGetAiHubReadiness();
    if (!error) aiReadiness.value = data;
  } finally {
    readinessLoading.value = false;
  }
}

async function loadKnowledgeBaseList(resetPage = false) {
  if (resetPage) page.value = 1;
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

async function loadDocumentFilters() {
  if (!activeKnowledgeBase.value) return;
  docFilterLoading.value = true;
  try {
    const { error, data } = await fetchGetDocumentFilters(activeKnowledgeBase.value.id, {
      keywords: docsKeywords.value || undefined
    });
    if (!error) {
      docFilter.value = data?.filter || { run_status: {}, suffix: {}, metadata: {} };
    }
  } finally {
    docFilterLoading.value = false;
  }
}

async function loadDocuments(resetPage = false) {
  if (!activeKnowledgeBase.value) return;
  if (resetPage) docsPage.value = 1;

  docsLoading.value = true;
  try {
    const { error, data } = await fetchGetDocumentList(activeKnowledgeBase.value.id, {
      current: docsPage.value,
      size: docsPageSize.value,
      keywords: docsKeywords.value || undefined,
      run: selectedRunFilters.value.length ? selectedRunFilters.value : undefined,
      suffix: selectedSuffixFilters.value.length ? selectedSuffixFilters.value : undefined,
      metadata: hasMetadataFilterValue(selectedMetadataFilters.value) ? selectedMetadataFilters.value : undefined,
      return_empty_metadata: includeEmptyMetadata.value || undefined
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
  if (!hasAuth('knowledge:add')) return;
  if (!aiReadiness.value) await loadAiReadiness();

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

async function handleEnterKnowledgeBase(item: Api.Knowledge.KnowledgeBase) {
  activeKnowledgeBase.value = item;
  activeDetailTab.value = 'file';
  docsKeywords.value = '';
  checkedDocIds.value = [];
  selectedRunFilters.value = [];
  selectedSuffixFilters.value = [];
  pendingRunFilters.value = [];
  pendingSuffixFilters.value = [];
  selectedMetadataFilters.value = {};
  pendingMetadataFilters.value = {};
  includeEmptyMetadata.value = false;
  pendingIncludeEmptyMetadata.value = false;
  await Promise.all([loadDocumentFilters(), loadDocuments(true)]);
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
  if (!hasAuth('knowledge:delete')) return;
  const { error } = await fetchDeleteKnowledgeBase(item.id);
  if (error) return;
  window.$message?.success('删除成功');
  if (activeKnowledgeBase.value?.id === item.id) activeKnowledgeBase.value = null;
  await loadKnowledgeBaseList();
}

async function handleSubmitRename() {
  const kb = renamingKnowledgeBase.value;
  const nextName = renameValue.value.trim();
  if (!kb || !nextName) return;

  renamingLoading.value = true;
  try {
    const { error } = await fetchUpdateKnowledgeBase(kb.id, { name: nextName });
    if (error) return;
    renameVisible.value = false;
    if (activeKnowledgeBase.value?.id === kb.id) {
      activeKnowledgeBase.value = { ...activeKnowledgeBase.value, name: nextName };
    }
    await loadKnowledgeBaseList();
  } finally {
    renamingLoading.value = false;
  }
}

async function runDocuments(ids: string[], run: 1 | 2, options?: { delete?: boolean; applyKb?: boolean }) {
  if (!activeKnowledgeBase.value || !ids.length) return;
  const { error } = await fetchRunDocuments(activeKnowledgeBase.value.id, {
    ids,
    run,
    delete: options?.delete,
    applyKb: options?.applyKb
  });
  if (error) return;
  await loadDocuments();
}

async function handleParseDocuments(ids: string[], options?: { delete?: boolean; applyKb?: boolean }) {
  await runDocuments(ids, 1, options);
}

async function handleStopDocuments(ids: string[]) {
  await runDocuments(ids, 2);
}

function openReparseModal(row: Api.Knowledge.Document) {
  reparseTarget.value = row;
  reparseDelete.value = Number(row.chunkNum ?? 0) > 0;
  reparseApplyKb.value = false;
  reparseVisible.value = true;
}

async function handleConfirmReparse() {
  if (!reparseTarget.value) return;
  reparseLoading.value = true;
  try {
    await handleParseDocuments([reparseTarget.value.id], {
      delete: showReparseDelete.value ? reparseDelete.value : false,
      applyKb: showReparseApplyKb.value ? reparseApplyKb.value : false
    });
    reparseVisible.value = false;
  } finally {
    reparseLoading.value = false;
  }
}

function handleRunActionClick(row: Api.Knowledge.Document) {
  if (isDocumentRunning(row)) {
    handleStopDocuments([row.id]);
    return;
  }

  const needConfirm = Number(row.chunkNum ?? 0) > 0 || Boolean((row.parserConfig as any)?.enable_metadata);
  if (needConfirm) {
    openReparseModal(row);
  } else {
    handleParseDocuments([row.id]);
  }
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
  if (!activeKnowledgeBase.value || !record || !nextName) return;

  renamingDocumentLoading.value = true;
  try {
    const { error } = await fetchUpdateDocument(activeKnowledgeBase.value.id, record.id, { name: nextName });
    if (error) return;
    renameDocumentVisible.value = false;
    await loadDocuments();
  } finally {
    renamingDocumentLoading.value = false;
  }
}

async function handlePreviewDocument(row: Api.Knowledge.Document) {
  if (!activeKnowledgeBase.value) return;
  try {
    const { blob } = await fetchPreviewDocument(activeKnowledgeBase.value.id, row.id);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : '预览失败');
  }
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
  await Promise.all([loadDocuments(), loadKnowledgeBaseList()]);
}

function handleOpenMetadata(row: Api.Knowledge.Document) {
  metadataTarget.value = row;
  metadataVisible.value = true;
}

function hasRunningDocuments() {
  return docs.value.some(item => isDocumentRunning(item));
}

function clearDocsPollingTimer() {
  if (docsPollingTimer !== null) {
    window.clearInterval(docsPollingTimer);
    docsPollingTimer = null;
  }
}

function setupDocsPolling() {
  clearDocsPollingTimer();
  if (!activeKnowledgeBase.value || activeDetailTab.value !== 'file' || !hasRunningDocuments()) return;
  docsPollingTimer = window.setInterval(() => {
    if (!docsLoading.value) {
      void loadDocuments(false);
    }
  }, DOC_LIST_POLL_INTERVAL);
}

function handleDetailTabChange(tab: DetailTab) {
  activeDetailTab.value = tab;
}

function handleCreateFileAction(key: string | number) {
  if (!hasAuth('knowledge:add')) return;
  if (String(key) === 'upload') {
    uploadVisible.value = true;
    return;
  }
  emptyName.value = '';
  emptyVisible.value = true;
}

async function handleSubmitEmptyDocument() {
  if (!activeKnowledgeBase.value) return;
  const name = emptyName.value.trim();
  if (!name) {
    window.$message?.warning('请输入文件名称');
    return;
  }
  emptyLoading.value = true;
  try {
    const { error } = await fetchCreateEmptyDocument(activeKnowledgeBase.value.id, name);
    if (error) return;
    emptyVisible.value = false;
    emptyName.value = '';
    await Promise.all([loadDocuments(true), loadKnowledgeBaseList()]);
  } finally {
    emptyLoading.value = false;
  }
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

function handleOpenFilterPopover(show: boolean) {
  docFilterPopoverVisible.value = show;
  if (show) {
    pendingRunFilters.value = [...selectedRunFilters.value];
    pendingSuffixFilters.value = [...selectedSuffixFilters.value];
    pendingMetadataFilters.value = cloneMetadataFilters(selectedMetadataFilters.value);
    pendingIncludeEmptyMetadata.value = includeEmptyMetadata.value;
    loadDocumentFilters();
  }
}

function applyDocumentFilters() {
  selectedRunFilters.value = [...pendingRunFilters.value];
  selectedSuffixFilters.value = [...pendingSuffixFilters.value];
  selectedMetadataFilters.value = cloneMetadataFilters(pendingMetadataFilters.value);
  includeEmptyMetadata.value = pendingIncludeEmptyMetadata.value;
  docFilterPopoverVisible.value = false;
  loadDocuments(true);
}

function resetDocumentFilters() {
  pendingRunFilters.value = [];
  pendingSuffixFilters.value = [];
  pendingMetadataFilters.value = {};
  pendingIncludeEmptyMetadata.value = false;
  selectedRunFilters.value = [];
  selectedSuffixFilters.value = [];
  selectedMetadataFilters.value = {};
  includeEmptyMetadata.value = false;
  docFilterPopoverVisible.value = false;
  loadDocuments(true);
}

function getPendingMetadataValues(field: string) {
  return pendingMetadataFilters.value[field] ?? [];
}

function handleUpdatePendingMetadata(field: string, values: Array<string | number> | null | undefined) {
  const nextValues = (values ?? []).map(item => String(item));
  if (nextValues.length === 0) {
    const next = { ...pendingMetadataFilters.value };
    delete next[field];
    pendingMetadataFilters.value = next;
    return;
  }
  pendingMetadataFilters.value = {
    ...pendingMetadataFilters.value,
    [field]: nextValues
  };
}

onMounted(async () => {
  await Promise.all([loadAiReadiness(), loadKnowledgeBaseList(true)]);
});

watch(
  () => [
    activeKnowledgeBase.value?.id ?? '',
    activeDetailTab.value,
    docs.value.map(item => `${item.id}:${getRunState(item.run)}`).join('|')
  ],
  () => {
    setupDocsPolling();
  }
);

onBeforeUnmount(() => {
  clearDocsPollingTimer();
});
</script>

<template>
  <div class="knowledge-page">
    <template v-if="!activeKnowledgeBase">
      <section class="knowledge-page__list-header">
        <h2 class="knowledge-page__title">知识库</h2>
        <div class="knowledge-page__list-actions">
          <NDropdown trigger="click" :options="statusOptions" @select="handleStatusSelect">
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
                <NDropdown trigger="click" :options="getCardMenuOptions()" @select="key => handleCardMenuSelect(String(key), item)">
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
                <p class="knowledge-detail__main-desc">解析成功后才能问答。</p>
              </div>
              <div class="knowledge-detail__toolbar-actions">
                <NButton quaternary circle disabled>
                  <template #icon>
                    <icon-carbon-magic-wand />
                  </template>
                </NButton>
                <NPopover
                  trigger="click"
                  placement="bottom-end"
                  :show="docFilterPopoverVisible"
                  @update:show="handleOpenFilterPopover"
                >
                  <template #trigger>
                    <NButton quaternary circle :type="hasDocumentFilter ? 'primary' : 'default'">
                      <template #icon>
                        <icon-mdi-filter-outline />
                      </template>
                    </NButton>
                  </template>
                  <div class="doc-filter-panel">
                    <NSpin :show="docFilterLoading">
                      <div class="doc-filter-section">
                        <p class="doc-filter-title">解析状态</p>
                        <NCheckboxGroup v-model:value="pendingRunFilters">
                          <NSpace vertical size="small">
                            <NCheckbox
                              v-for="item in runFilterOptions"
                              :key="item.key"
                              :value="item.key"
                              :label="item.label"
                            />
                          </NSpace>
                        </NCheckboxGroup>
                        <div v-if="emptyMetadataCount > 0" class="doc-filter-empty-meta">
                          <NCheckbox v-model:checked="pendingIncludeEmptyMetadata">
                            空元数据 ({{ emptyMetadataCount }})
                          </NCheckbox>
                        </div>
                      </div>
                      <div class="doc-filter-section">
                        <p class="doc-filter-title">文件后缀</p>
                        <NCheckboxGroup v-model:value="pendingSuffixFilters">
                          <NSpace vertical size="small">
                            <NCheckbox
                              v-for="item in suffixFilterOptions"
                              :key="item.key"
                              :value="item.key"
                              :label="item.label"
                            />
                          </NSpace>
                        </NCheckboxGroup>
                      </div>
                      <div
                        v-for="metaField in metadataFilterOptions"
                        :key="metaField.field"
                        class="doc-filter-section"
                      >
                        <p class="doc-filter-title">{{ metaField.field }} ({{ metaField.totalCount }})</p>
                        <NCheckboxGroup
                          :value="getPendingMetadataValues(metaField.field)"
                          @update:value="values => handleUpdatePendingMetadata(metaField.field, values)"
                        >
                          <NSpace vertical size="small">
                            <NCheckbox
                              v-for="item in metaField.options"
                              :key="item.value"
                              :value="item.value"
                              :label="item.label"
                            />
                          </NSpace>
                        </NCheckboxGroup>
                      </div>
                    </NSpin>
                    <div class="doc-filter-actions">
                      <NButton text @click="resetDocumentFilters">重置</NButton>
                      <NButton type="primary" size="small" @click="applyDocumentFilters">应用</NButton>
                    </div>
                  </div>
                </NPopover>
                <NInput
                  v-model:value="docsKeywords"
                  clearable
                  class="knowledge-detail__search"
                  placeholder="搜索"
                  @keyup.enter="
                    () => {
                      loadDocumentFilters();
                      loadDocuments(true);
                    }
                  "
                >
                  <template #prefix>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                </NInput>
                <NDropdown trigger="click" :options="addFileOptions" @select="handleCreateFileAction">
                  <NButton type="primary">
                    <template #icon>
                      <icon-ic-round-plus class="text-icon" />
                    </template>
                    新增文件
                  </NButton>
                </NDropdown>
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
              :row-class-name="() => 'knowledge-doc-row'"
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

          <KnowledgeSearchPanel
            v-else-if="activeDetailTab === 'search'"
            :knowledge-base="activeKnowledgeBase"
            :documents="docs"
          />
          <KnowledgeLogPanel v-else-if="activeDetailTab === 'log'" :knowledge-base="activeKnowledgeBase" />
          <KnowledgeConfigPanel v-else :knowledge-base="activeKnowledgeBase" />
        </main>
      </section>
    </template>

    <KnowledgeOperateModal v-model:visible="createVisible" operate-type="add" @submitted="handleCreateSubmitted" />

    <KnowledgeUploadModal
      v-model:visible="uploadVisible"
      :knowledge-base="activeKnowledgeBase"
      :limit-tip="uploadLimitTip"
      @uploaded="handleUploadSubmitted"
    />

    <NModal
      v-model:show="emptyVisible"
      preset="card"
      title="新增空白文件"
      class="w-520px max-w-92vw"
      :bordered="false"
    >
      <NForm label-placement="top">
        <NFormItem label="文件名称">
          <NInput v-model:value="emptyName" placeholder="请输入文件名称，如：政策解读.md" maxlength="255" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="emptyVisible = false">取消</NButton>
          <NButton type="primary" :loading="emptyLoading" @click="handleSubmitEmptyDocument">确认</NButton>
        </NSpace>
      </template>
    </NModal>

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

    <NModal v-model:show="reparseVisible" preset="card" title="解析文件" class="w-520px max-w-90vw" :bordered="false">
      <div class="reparse-content">
        <p class="reparse-tip">可选择是否重置已有分块，或应用知识库的自动元数据配置。</p>
        <div v-if="showReparseDelete" class="reparse-option">
          <NCheckbox v-model:checked="reparseDelete">
            重做已有分块（{{ reparseTarget?.chunkNum || 0 }} 个分块）
          </NCheckbox>
        </div>
        <div v-if="showReparseApplyKb" class="reparse-option">
          <NCheckbox v-model:checked="reparseApplyKb">应用知识库自动元数据设置</NCheckbox>
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="reparseVisible = false">取消</NButton>
          <NButton type="primary" :loading="reparseLoading" @click="handleConfirmReparse">确认</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="metadataVisible" preset="card" title="元数据" class="w-680px max-w-92vw" :bordered="false">
      <div class="doc-meta-detail">
        <p class="doc-meta-detail__title">{{ metadataTarget?.name || '-' }}</p>
        <pre class="doc-meta-detail__content">{{ JSON.stringify(metadataTarget?.metaFields ?? {}, null, 2) }}</pre>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="metadataVisible = false">关闭</NButton>
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.knowledge-card {
  min-height: 148px;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
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
  min-height: calc(100vh - 132px);
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 14px;
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
  font-size: 13px;
  line-height: 1.4;
}

.knowledge-detail__tabs {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.knowledge-detail__tab {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  color: #4b5563;
  background: transparent;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}

.knowledge-detail__tab:hover {
  background: #f3f4f6;
}

.knowledge-detail__tab--active {
  color: #111827;
  background: #f3f4f6;
  font-weight: 600;
}

.knowledge-detail__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-detail__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.knowledge-detail__main-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.knowledge-detail__main-desc {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.knowledge-detail__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.knowledge-detail__search {
  width: 180px;
}

.knowledge-detail__batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.knowledge-detail__table {
  min-height: 360px;
}

.doc-filter-panel {
  width: 320px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-filter-section {
  padding: 2px 2px 0;
}

.doc-filter-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}

.doc-filter-empty-meta {
  margin-top: 10px;
}

.doc-filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reparse-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reparse-tip {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.reparse-option {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

:deep(.doc-parser-btn) {
  color: #6b7280;
}

:deep(.doc-run-cell) {
  min-height: 26px;
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.doc-run-separator) {
  width: 1px;
  height: 14px;
  background: #d1d5db;
}

:deep(.doc-run-progress) {
  min-width: 82px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

:deep(.doc-run-progress-text) {
  color: #6b7280;
  font-size: 12px;
}

:deep(.doc-run-action) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #18b9b8;
  padding: 0;
}

:deep(.doc-run-action--running),
:deep(.doc-run-action--schedule) {
  color: #ef4444;
}

:deep(.doc-run-dot-btn) {
  padding: 0;
}

:deep(.doc-run-dot) {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  display: inline-block;
}

:deep(.doc-log-popover) {
  width: 320px;
  max-width: 40vw;
  display: flex;
  flex-direction: column;
  gap: 8px;
  white-space: normal;
}

:deep(.doc-log-popover__status) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

:deep(.doc-log-popover__dot) {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  display: inline-block;
}

:deep(.doc-log-popover__line) {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
}

:deep(.doc-log-popover__line--block) {
  flex-direction: column;
  gap: 4px;
}

:deep(.doc-log-popover__message) {
  max-height: 160px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.45;
  color: #111827;
  font-family: inherit;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
}

:deep(.doc-actions) {
  display: inline-flex;
  gap: 4px;
}

:deep(.knowledge-doc-row .doc-actions) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.knowledge-doc-row:hover .doc-actions),
:deep(.knowledge-doc-row:focus-within .doc-actions) {
  opacity: 1;
}

:deep(.doc-name-btn) {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

:deep(.doc-name-icon) {
  color: #6b7280;
  font-size: 14px;
}

:deep(.doc-name-text) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.doc-meta-btn) {
  color: #4b5563;
}

.doc-meta-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-meta-detail__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.doc-meta-detail__content {
  max-height: 420px;
  margin: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #111827;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 1280px) {
  .knowledge-page {
    padding: 12px;
  }

  .knowledge-detail {
    grid-template-columns: 1fr;
  }

  .knowledge-detail__sidebar {
    padding: 0;
  }

  .knowledge-detail__tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
}
</style>
