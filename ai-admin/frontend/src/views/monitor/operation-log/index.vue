<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchGetOperationLogList } from '@/service/api';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();

const searchParams = ref<Api.SystemManage.OperationLogSearchParams>({
  current: 1, size: 20, username: null, module: null,
});

const { columns, data, loading, mobilePagination, getData } = useNaivePaginatedTable({
  api: () => fetchGetOperationLogList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    { key: 'index', title: '序号', width: 60, align: 'center', render: (_, i) => i + 1 },
    { key: 'username', title: '操作人', width: 100, align: 'center' },
    { key: 'module', title: '模块', width: 100, align: 'center' },
    { key: 'action', title: '操作', width: 100, align: 'center' },
    { key: 'method', title: '请求方式', width: 80, align: 'center' },
    { key: 'url', title: 'URL', minWidth: 200 },
    { key: 'ip', title: 'IP', width: 130, align: 'center' },
    {
      key: 'responseCode', title: '状态码', width: 80, align: 'center',
      render: row => {
        const code = row.responseCode;
        if (!code) return null;
        const type: NaiveUI.ThemeColor = code < 300 ? 'success' : code < 500 ? 'warning' : 'error';
        return <NTag type={type} size="small">{code}</NTag>;
      },
    },
    { key: 'duration', title: '耗时(ms)', width: 90, align: 'center' },
    { key: 'createTime', title: '时间', width: 160, align: 'center',
      render: row => row.createTime?.slice(0, 19).replace('T', ' ') },
  ],
});
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="操作日志" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NInput v-model:value="searchParams.username" placeholder="操作人" clearable style="width: 120px" @keyup.enter="getData" />
          <NInput v-model:value="searchParams.module" placeholder="模块" clearable style="width: 120px" @keyup.enter="getData" />
          <NButton type="primary" ghost @click="getData">查询</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1000"
        :loading="loading"
        :row-key="row => row.id"
        remote
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>
