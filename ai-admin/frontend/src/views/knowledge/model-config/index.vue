<script setup lang="ts">
import ModelConfigPanel from './modules/model-config-panel.vue';
</script>

<template>
  <div class="ai-model-config-page">
    <ModelConfigPanel />
  </div>
</template>

<style scoped>
.ai-model-config-page {
  min-height: 100vh;
  padding: 0;
  color: #171923;
  background: #fff;
}

.dark .ai-model-config-page {
  background: #101014;
}
</style>
