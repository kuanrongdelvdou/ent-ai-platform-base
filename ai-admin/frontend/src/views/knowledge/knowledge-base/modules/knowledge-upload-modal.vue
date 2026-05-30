<script setup lang="ts">
import { computed, ref } from 'vue';
import { fetchParseDocuments, fetchUploadDocument } from '@/service/api';

defineOptions({ name: 'KnowledgeUploadModal' });

interface Props {
  knowledgeBase?: Api.Knowledge.KnowledgeBase | null;
  limitTip?: string;
}

interface Emits {
  (e: 'uploaded'): void;
}

type PendingFile = {
  id: string;
  file: File;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const visible = defineModel<boolean>('visible', { default: false });

const parseOnCreation = ref(false);
const uploadMode = ref<'file' | 'folder'>('file');
const uploading = ref(false);
const dragOver = ref(false);
const pendingFiles = ref<PendingFile[]>([]);

const fileInputRef = ref<HTMLInputElement | null>(null);
const folderInputRef = ref<HTMLInputElement | null>(null);

const canSave = computed(() => !!props.knowledgeBase && pendingFiles.value.length > 0 && !uploading.value);
const MAX_BATCH_FILE_COUNT = 32;
const MAX_BATCH_TOTAL_SIZE = 1024 * 1024 * 1024;

const hintText = computed(
  () =>
    props.limitTip ||
    '支持单次或批量上传。本地部署单次上传总大小上限 1GB，单次批量上传文件数不超过 32，单个账户不限文件数量。'
);

function resetState() {
  parseOnCreation.value = false;
  uploadMode.value = 'file';
  dragOver.value = false;
  pendingFiles.value = [];
}

function getFileKey(file: File) {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

function addFiles(files: File[]) {
  const existing = new Set(pendingFiles.value.map(item => getFileKey(item.file)));
  const newItems = files
    .filter(file => !existing.has(getFileKey(file)))
    .map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file
    }));
  pendingFiles.value = [...pendingFiles.value, ...newItems];
}

function formatSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function openFilePicker() {
  uploadMode.value = 'file';
  fileInputRef.value?.click();
}

function openFolderPicker() {
  uploadMode.value = 'folder';
  folderInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  addFiles(files);
  target.value = '';
}

function removePendingFile(id: string) {
  pendingFiles.value = pendingFiles.value.filter(item => item.id !== id);
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragOver.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  addFiles(files);
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  dragOver.value = true;
}

function onDragLeave() {
  dragOver.value = false;
}

function collectUploadedDocumentIds(payload: unknown): string[] {
  if (!payload) return [];

  const source: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.docs)
      ? (payload as any).docs
      : Array.isArray((payload as any)?.records)
        ? (payload as any).records
        : [payload];

  return source
    .map((item: any) => String(item?.id || item?.document_id || ''))
    .filter(Boolean);
}

async function handleSave() {
  if (!props.knowledgeBase || !pendingFiles.value.length) return;
  if (pendingFiles.value.length > MAX_BATCH_FILE_COUNT) {
    window.$message?.warning(`单次最多上传 ${MAX_BATCH_FILE_COUNT} 个文件，请分批上传`);
    return;
  }

  const totalSize = pendingFiles.value.reduce((sum, item) => sum + item.file.size, 0);
  if (totalSize > MAX_BATCH_TOTAL_SIZE) {
    window.$message?.warning('单次上传总大小不能超过 1GB，请分批上传');
    return;
  }

  uploading.value = true;
  try {
    const files = pendingFiles.value.map(item => item.file);
    const { error, data } = await fetchUploadDocument(props.knowledgeBase.id, files);
    if (error) return;

    const uploadedIds = collectUploadedDocumentIds(data as unknown);

    if (parseOnCreation.value && uploadedIds.length) {
      const { error } = await fetchParseDocuments(props.knowledgeBase.id, uploadedIds);
      if (!error) {
        window.$message?.success('文件上传并已提交解析任务');
      }
    } else if (parseOnCreation.value) {
      window.$message?.warning('文件已上传，但未获取到文档 ID，请在文件列表手动点解析');
    } else {
      window.$message?.success('文件上传成功');
    }

    resetState();
    visible.value = false;
    emit('uploaded');
  } finally {
    uploading.value = false;
  }
}

function handleClose() {
  visible.value = false;
  resetState();
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="上传文件" class="upload-modal" :bordered="false" @close="handleClose">
    <section class="upload-modal__body">
      <div class="upload-modal__switch">
        <span>创建时解析</span>
        <NSwitch v-model:value="parseOnCreation" />
      </div>

      <div class="upload-modal__mode">
        <NButton :type="uploadMode === 'file' ? 'default' : 'tertiary'" @click="openFilePicker">
          <template #icon>
            <icon-ic-outline-insert-drive-file />
          </template>
          文件
        </NButton>
        <NButton :type="uploadMode === 'folder' ? 'default' : 'tertiary'" @click="openFolderPicker">
          <template #icon>
            <icon-ic-outline-drive-folder-upload />
          </template>
          文件夹
        </NButton>
      </div>

      <div
        class="upload-modal__drop"
        :class="{ 'upload-modal__drop--active': dragOver }"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <div class="upload-modal__drop-icon">
          <icon-carbon-cloud-upload />
        </div>
        <p class="upload-modal__drop-title">点击或拖拽文件至此区域即可上传</p>
        <p class="upload-modal__drop-tip">{{ hintText }}</p>
      </div>

      <ul v-if="pendingFiles.length" class="upload-modal__file-list">
        <li v-for="item in pendingFiles" :key="item.id" class="upload-modal__file-item">
          <div class="upload-modal__file-main">
            <span class="upload-modal__file-name">{{ item.file.name }}</span>
            <span class="upload-modal__file-size">{{ formatSize(item.file.size) }}</span>
          </div>
          <NButton text type="error" @click="removePendingFile(item.id)">
            <template #icon>
              <icon-material-symbols-delete-outline-rounded />
            </template>
          </NButton>
        </li>
      </ul>
    </section>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="uploading" :disabled="!canSave" @click="handleSave">保存</NButton>
      </NSpace>
    </template>
  </NModal>

  <input ref="fileInputRef" type="file" multiple class="upload-modal__hidden-input" @change="handleFileChange" />
  <input
    ref="folderInputRef"
    type="file"
    multiple
    webkitdirectory
    directory
    class="upload-modal__hidden-input"
    @change="handleFileChange"
  />
</template>

<style scoped>
.upload-modal {
  width: 760px;
  max-width: 94vw;
}

.upload-modal__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.upload-modal__switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.upload-modal__mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 4px;
  background: #f5f6f8;
  border-radius: 10px;
}

.upload-modal__drop {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  background: #fafbfc;
  text-align: center;
  transition: border-color 0.2s ease;
}

.upload-modal__drop--active {
  border-color: #18c8c6;
}

.upload-modal__drop-icon {
  color: #6b7280;
  font-size: 42px;
}

.upload-modal__drop-title {
  margin: 0;
  color: #4b5563;
  font-size: 16px;
}

.upload-modal__drop-tip {
  max-width: 560px;
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.6;
}

.upload-modal__file-list {
  max-height: 200px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.upload-modal__file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #eceef1;
  border-radius: 8px;
}

.upload-modal__file-item + .upload-modal__file-item {
  margin-top: 8px;
}

.upload-modal__file-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.upload-modal__file-name {
  overflow: hidden;
  color: #111827;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.upload-modal__file-size {
  color: #9ca3af;
  font-size: 12px;
}

.upload-modal__hidden-input {
  display: none;
}
</style>
