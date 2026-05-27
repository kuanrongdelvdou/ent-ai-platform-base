<script setup lang="ts">
import { computed } from 'vue';

const ragflowUrl = computed(() => import.meta.env.VITE_RAGFLOW_WEB_URL || 'http://localhost/');
</script>

<template>
  <iframe
    :src="ragflowUrl"
    title="RAGFlow"
    class="size-full border-0 bg-white"
    allow="clipboard-read; clipboard-write; fullscreen"
  />
</template>
