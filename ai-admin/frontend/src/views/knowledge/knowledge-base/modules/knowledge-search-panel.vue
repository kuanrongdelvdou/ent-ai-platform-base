<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchSearchKnowledgeBase } from '@/service/api';

interface Props {
  knowledgeBase: Api.Knowledge.KnowledgeBase;
  documents: Api.Knowledge.Document[];
}

type SearchRecord = {
  id: string;
  documentName: string;
  content: string;
  similarity: number | null;
  raw: Record<string, any>;
};

const props = defineProps<Props>();

const loading = ref(false);
const question = ref('');
const topK = ref(30);
const similarityThreshold = ref(0);
const vectorWeight = ref(0.3);
const useKeyword = ref(false);
const useKnowledgeGraph = ref(false);
const selectedDocIds = ref<string[]>([]);

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const resultList = ref<SearchRecord[]>([]);

const docOptions = computed(() =>
  props.documents.map(item => ({
    label: item.name,
    value: item.id
  }))
);

function normalizeResultItem(item: Record<string, any>, index: number): SearchRecord {
  const id = String(item.id ?? item.chunk_id ?? `${index}`);
  const documentName = String(item.document_name ?? item.doc_name ?? item.docnm_kwd ?? '-');
  const content = String(item.content_with_weight ?? item.content ?? item.text ?? '');
  const similarityRaw = item.similarity ?? item.vector_similarity ?? item.term_similarity ?? item.score;
  const similarity = Number.isFinite(Number(similarityRaw)) ? Number(similarityRaw) : null;

  return {
    id,
    documentName,
    content,
    similarity,
    raw: item
  };
}

function normalizeSearchResponse(data: unknown) {
  const payload = (data ?? {}) as Record<string, any>;
  const chunks = Array.isArray(payload.chunks)
    ? payload.chunks
    : Array.isArray(payload.records)
      ? payload.records
      : Array.isArray(payload.data?.chunks)
        ? payload.data.chunks
        : [];

  return {
    total: Number(payload.total ?? payload.total_count ?? chunks.length ?? 0),
    records: chunks.map((item: Record<string, any>, index: number) => normalizeResultItem(item, index))
  };
}

async function runSearch(resetPage = false) {
  if (!question.value.trim()) {
    window.$message?.warning('请输入检索问题');
    return;
  }

  if (resetPage) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const { error, data } = await fetchSearchKnowledgeBase(props.knowledgeBase.id, {
      question: question.value.trim(),
      doc_ids: selectedDocIds.value,
      page: page.value,
      size: pageSize.value,
      top_k: topK.value,
      similarity_threshold: similarityThreshold.value,
      vector_similarity_weight: vectorWeight.value,
      keyword: useKeyword.value,
      use_kg: useKnowledgeGraph.value
    });

    if (error) return;
    const normalized = normalizeSearchResponse(data);
    resultList.value = normalized.records;
    total.value = normalized.total;
  } finally {
    loading.value = false;
  }
}

function onPageChange(current: number) {
  page.value = current;
  runSearch(false);
}

function onPageSizeChange(size: number) {
  pageSize.value = size;
  runSearch(true);
}

watch(
  () => props.knowledgeBase.id,
  () => {
    question.value = '';
    selectedDocIds.value = [];
    resultList.value = [];
    total.value = 0;
    page.value = 1;
  }
);
</script>

<template>
  <section class="search-panel">
    <article class="search-panel__form">
      <h3 class="search-panel__title">检索测试</h3>
      <p class="search-panel__desc">对齐 RAGFlow 检索参数，快速验证召回效果。</p>

      <NForm label-placement="top" size="small">
        <NFormItem label="问题">
          <NInput
            v-model:value="question"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="请输入检索问题"
            @keydown.enter.exact.prevent="runSearch(true)"
          />
        </NFormItem>

        <NFormItem label="文档范围">
          <NSelect
            v-model:value="selectedDocIds"
            multiple
            clearable
            filterable
            placeholder="不选择则检索整个知识库"
            :options="docOptions"
          />
        </NFormItem>

        <div class="search-panel__grid">
          <NFormItem label="Top K">
            <NInputNumber v-model:value="topK" :min="1" :max="2048" />
          </NFormItem>
          <NFormItem label="相似度阈值">
            <NInputNumber v-model:value="similarityThreshold" :min="0" :max="1" :step="0.05" />
          </NFormItem>
          <NFormItem label="向量权重">
            <NInputNumber v-model:value="vectorWeight" :min="0" :max="1" :step="0.05" />
          </NFormItem>
        </div>

        <NSpace align="center" :size="18">
          <NCheckbox v-model:checked="useKeyword">关键词检索增强</NCheckbox>
          <NCheckbox v-model:checked="useKnowledgeGraph">启用知识图谱检索</NCheckbox>
        </NSpace>

        <div class="search-panel__actions">
          <NButton type="primary" :loading="loading" @click="runSearch(true)">
            <template #icon>
              <icon-ic-round-search class="text-icon" />
            </template>
            检索
          </NButton>
        </div>
      </NForm>
    </article>

    <article class="search-panel__result">
      <header class="search-panel__result-head">
        <h3 class="search-panel__title">结果</h3>
        <span class="search-panel__count">共 {{ total }} 条</span>
      </header>

      <NSpin :show="loading">
        <NEmpty v-if="!resultList.length" description="暂无检索结果" />
        <ul v-else class="search-panel__list">
          <li v-for="item in resultList" :key="item.id" class="search-panel__item">
            <div class="search-panel__item-head">
              <strong class="search-panel__doc">{{ item.documentName }}</strong>
              <NTag v-if="item.similarity !== null" size="small" :bordered="false">
                相似度 {{ item.similarity.toFixed(3) }}
              </NTag>
            </div>
            <p class="search-panel__content">{{ item.content || JSON.stringify(item.raw) }}</p>
          </li>
        </ul>
      </NSpin>

      <footer class="search-panel__pagination" v-if="total > 0">
        <NPagination
          :page="page"
          :page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </footer>
    </article>
  </section>
</template>

<style scoped>
.search-panel {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 14px;
}

.search-panel__form,
.search-panel__result {
  border: 1px solid #eceef1;
  border-radius: 10px;
  background: #fff;
}

.search-panel__form {
  padding: 14px;
}

.search-panel__result {
  min-height: 560px;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.search-panel__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.search-panel__desc {
  margin: 6px 0 12px;
  color: #6b7280;
  font-size: 13px;
}

.search-panel__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.search-panel__actions {
  margin-top: 8px;
}

.search-panel__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search-panel__count {
  color: #6b7280;
  font-size: 13px;
}

.search-panel__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-panel__item {
  padding: 12px;
  border: 1px solid #eceef1;
  border-radius: 8px;
}

.search-panel__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.search-panel__doc {
  color: #111827;
  font-size: 14px;
}

.search-panel__content {
  margin: 8px 0 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.search-panel__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 12px;
}

@media (max-width: 1280px) {
  .search-panel {
    grid-template-columns: 1fr;
  }

  .search-panel__result {
    min-height: 380px;
  }
}
</style>
