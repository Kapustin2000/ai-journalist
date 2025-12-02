<template>
  <div class="panel">
    <div class="panel-header">
      <div>
        <p class="label">Журнал</p>
        <h2>История</h2>
      </div>
      <button class="ghost" @click="$emit('refresh')" :disabled="!documentId">
        Обновить
      </button>
    </div>
    <div v-if="!documentId" class="empty-state">Нет выбранного документа</div>
    <ul v-else class="history-list">
      <li v-for="entry in history" :key="entry.id" class="history-item">
        <div class="history-meta">
          <strong>{{ new Date(entry.timestamp).toLocaleString() }}</strong>
          <span>{{ entry.note ?? 'Без комментария' }}</span>
        </div>
        <details>
          <summary>Показать контент</summary>
          <pre>{{ pretty(entry.content) }}</pre>
        </details>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { DocumentHistoryEntry } from '../types/documents';

defineProps<{
  documentId?: string | null;
  history: DocumentHistoryEntry[];
}>();

defineEmits<{
  refresh: [];
}>();

const pretty = (value: unknown) => JSON.stringify(value, null, 2);
</script>

<style scoped>
.panel {
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 shadow-lg shadow-slate-950/30 h-full;
}

.panel-header {
  @apply flex items-center justify-between;
}

.panel-header .label {
  @apply text-xs uppercase tracking-widest text-slate-500;
}

.panel-header h2 {
  @apply text-xl font-semibold text-slate-50;
}

.ghost {
  @apply text-sky-400 hover:text-sky-300 transition disabled:opacity-40;
}

.history-list {
  @apply flex flex-col gap-3 overflow-y-auto max-h-[40vh] pr-1;
}

.history-item {
  @apply border border-slate-800 rounded-2xl p-4 bg-slate-950/50;
}

.history-meta {
  @apply flex flex-col gap-1 mb-3 text-sm text-slate-300;
}

.history-meta strong {
  @apply text-slate-100;
}

details {
  @apply text-xs text-slate-400;
}

summary {
  @apply cursor-pointer text-sky-300 hover:text-sky-200;
}

pre {
  @apply bg-slate-950 text-slate-50 p-3 rounded-xl mt-2 border border-slate-800 overflow-auto;
}

.empty-state {
  @apply border border-dashed border-slate-700 rounded-2xl p-6 text-center text-slate-400;
}
</style>

