<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchSearchKnowledgeBase } from '@/service/api';

defineOptions({ name: 'KnowledgeSearchModal' });

interface Props {
  knowledgeBase?: Api.Knowledge.KnowledgeBase | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

const question = ref('');
const loading = ref(false);
const results = ref<Api.Knowledge.SearchResult[]>([]);

const title = computed(() => (props.knowledgeBase ? `知识库检索 - ${props.knowledgeBase.name}` : '知识库检索'));

function normalizeResults(data: any): Api.Knowledge.SearchResult[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.chunks)) return data.chunks;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data?.chunks)) return data.data.chunks;

  return [];
}

async function handleSearch() {
  if (!props.knowledgeBase || !question.value.trim()) {
    window.$message?.warning('请输入检索问题');
    return;
  }

  loading.value = true;
  try {
    const { error, data } = await fetchSearchKnowledgeBase(props.knowledgeBase.id, {
      question: question.value.trim(),
      page: 1,
      size: 10
    });

    if (!error) {
      results.value = normalizeResults(data);
    }
  } finally {
    loading.value = false;
  }
}

watch(visible, () => {
  if (visible.value) {
    question.value = '';
    results.value = [];
  }
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-760px max-w-92vw" :bordered="false">
    <NSpace vertical :size="16">
      <NInputGroup>
        <NInput v-model:value="question" placeholder="输入政策、公文或业务问题" @keyup.enter="handleSearch" />
        <NButton type="primary" :loading="loading" @click="handleSearch">
          <template #icon>
            <icon-ic-round-search class="text-icon" />
          </template>
          检索
        </NButton>
      </NInputGroup>

      <NEmpty v-if="!results.length && !loading" description="暂无检索结果" />
      <NSkeleton v-if="loading" text :repeat="4" />
      <NSpace v-else vertical :size="12">
        <NCard v-for="(item, index) in results" :key="item.id || index" size="small" :bordered="true">
          <NSpace vertical :size="8">
            <div class="flex items-center justify-between gap-12px">
              <NText strong>{{ item.documentName || item.document_id || item.documentId || `片段 ${index + 1}` }}</NText>
              <NTag v-if="item.similarity || item.score" size="small" type="info">
                {{ Number(item.similarity ?? item.score).toFixed(3) }}
              </NTag>
            </div>
            <NText depth="2">{{ item.content || item.text || JSON.stringify(item) }}</NText>
          </NSpace>
        </NCard>
      </NSpace>
    </NSpace>
  </NModal>
</template>
