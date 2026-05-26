<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchGetLoginLogList } from '@/service/api';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();

const searchParams = ref<Api.SystemManage.LoginLogSearchParams>({
  current: 1, size: 20, username: null, status: null,
});

const { columns, data, loading, mobilePagination, getData } = useNaivePaginatedTable({
  api: () => fetchGetLoginLogList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    { key: 'index', title: '序号', width: 60, align: 'center', render: (_, i) => i + 1 },
    { key: 'username', title: '用户名', width: 120, align: 'center' },
    { key: 'ip', title: 'IP', width: 130, align: 'center' },
    {
      key: 'status', title: '状态', width: 80, align: 'center',
      render: row => {
        const type: NaiveUI.ThemeColor = row.status === '1' ? 'success' : 'error';
        return <NTag type={type} size="small">{row.status === '1' ? '成功' : '失败'}</NTag>;
      },
    },
    { key: 'message', title: '消息', minWidth: 150 },
    { key: 'userAgent', title: 'User-Agent', minWidth: 200 },
    { key: 'createTime', title: '时间', width: 160, align: 'center',
      render: row => row.createTime?.slice(0, 19).replace('T', ' ') },
  ],
});
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="登录日志" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NInput v-model:value="searchParams.username" placeholder="用户名" clearable style="width: 120px" @keyup.enter="getData" />
          <NSelect
            v-model:value="searchParams.status"
            placeholder="状态"
            clearable
            style="width: 100px"
            :options="[{ label: '成功', value: '1' }, { label: '失败', value: '0' }]"
          />
          <NButton type="primary" ghost @click="getData">查询</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="900"
        :loading="loading"
        :row-key="row => row.id"
        remote
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>
