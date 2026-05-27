<script setup lang="tsx">
import { ref, watch } from 'vue';
import type { UploadCustomRequestOptions } from 'naive-ui';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import type { FlatResponseData } from '@sa/axios';
import {
  fetchDeleteDocuments,
  fetchGetDocumentList,
  fetchParseDocuments,
  fetchStopParsing,
  fetchUploadDocument
} from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';

defineOptions({ name: 'KnowledgeUploadModal' });

interface Props {
  knowledgeBase?: Api.Knowledge.KnowledgeBase | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });
const appStore = useAppStore();
const checkedRowKeys = ref<string[]>([]);

const searchParams = ref<Api.Knowledge.DocumentListParams>({
  current: 1,
  size: 10,
  keywords: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable<
  FlatResponseData<any, Api.Knowledge.DocumentList>,
  Api.Knowledge.Document
>({
  api: () =>
    props.knowledgeBase
      ? fetchGetDocumentList(props.knowledgeBase.id, searchParams.value)
      : Promise.resolve({ error: null, data: { records: [], current: 1, size: 10, total: 0 } } as any),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'name', title: '文档名称', minWidth: 220, ellipsis: { tooltip: true } },
    {
      key: 'status',
      title: '状态',
      width: 110,
      align: 'center',
      render: row => <NTag size="small">{row.status || row.run || '-'}</NTag>
    },
    {
      key: 'progress',
      title: '解析进度',
      width: 100,
      align: 'center',
      render: row => (typeof row.progress === 'number' ? `${Math.round(row.progress * 100)}%` : '-')
    },
    { key: 'chunkNum', title: '分块数', width: 90, align: 'center' },
    { key: 'tokenNum', title: 'Token', width: 100, align: 'center' },
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
      width: 210,
      align: 'center',
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleParse([row.id])}>
            解析
          </NButton>
          <NButton type="warning" ghost size="small" onClick={() => handleStop([row.id])}>
            停止
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete([row.id])}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  删除
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

async function customRequest({ file, onFinish, onError }: UploadCustomRequestOptions) {
  if (!props.knowledgeBase || !file.file) {
    onError();
    return;
  }

  const { error } = await fetchUploadDocument(props.knowledgeBase.id, file.file);
  if (error) {
    onError();
    return;
  }

  window.$message?.success('上传成功');
  onFinish();
  await getData();
}

async function handleSearch() {
  await getDataByPage(1);
}

async function handleParse(ids: string[]) {
  if (!props.knowledgeBase || !ids.length) return;
  const { error } = await fetchParseDocuments(props.knowledgeBase.id, ids);
  if (!error) {
    window.$message?.success('已提交解析任务');
    await getData();
  }
}

async function handleStop(ids: string[]) {
  if (!props.knowledgeBase || !ids.length) return;
  const { error } = await fetchStopParsing(props.knowledgeBase.id, ids);
  if (!error) {
    window.$message?.success('已停止解析任务');
    await getData();
  }
}

async function handleDelete(ids: string[]) {
  if (!props.knowledgeBase || !ids.length) return;
  const { error } = await fetchDeleteDocuments(props.knowledgeBase.id, ids);
  if (!error) {
    checkedRowKeys.value = [];
    window.$message?.success($t('common.deleteSuccess'));
    await getData();
  }
}

watch(visible, () => {
  if (visible.value) {
    checkedRowKeys.value = [];
    getDataByPage(1);
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="knowledgeBase ? `文档管理 - ${knowledgeBase.name}` : '文档管理'"
    class="w-980px max-w-94vw"
    :bordered="false"
  >
    <NSpace vertical :size="16">
      <NUpload :custom-request="customRequest" multiple :show-file-list="false">
        <NUploadDragger>
          <div class="mb-8px text-30px text-primary">
            <icon-carbon-cloud-upload />
          </div>
          <NText>点击或拖拽文件到此处上传</NText>
        </NUploadDragger>
      </NUpload>

      <div class="flex items-center justify-between gap-12px">
        <NInputGroup class="max-w-360px">
          <NInput v-model:value="searchParams.keywords" clearable placeholder="搜索文档名称" @keyup.enter="handleSearch" />
          <NButton :loading="loading" @click="handleSearch">
            <template #icon>
              <icon-ic-round-search class="text-icon" />
            </template>
          </NButton>
        </NInputGroup>
        <NSpace>
          <NButton :disabled="!checkedRowKeys.length" @click="handleParse(checkedRowKeys)">批量解析</NButton>
          <NButton :disabled="!checkedRowKeys.length" @click="handleStop(checkedRowKeys)">停止解析</NButton>
          <NPopconfirm :disabled="!checkedRowKeys.length" @positive-click="handleDelete(checkedRowKeys)">
            <template #trigger>
              <NButton type="error" ghost :disabled="!checkedRowKeys.length">批量删除</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </NSpace>
      </div>

      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="960"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="h-420px"
      />
    </NSpace>
  </NModal>
</template>
