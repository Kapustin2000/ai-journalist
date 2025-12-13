<template>
  <div class="panel">
    <div class="panel-header">
      <div>
        <p class="label">Список</p>
        <h2>Документы</h2>
      </div>
      <button class="ghost" @click="$emit('refresh')">Обновить</button>
    </div>
    <div v-if="!documents.length" class="empty-state">
      Документов пока нет. Создайте сессию, чтобы получить первый черновик.
    </div>
    <ul v-else class="document-list">
      <li
        v-for="doc in documents"
        :key="doc.id"
        :class="['document-card', { active: doc.id === selectedId }]"
        @click="$emit('select', doc.id)"
      >
        <div class="doc-title">{{ doc.title ?? 'Без названия' }}</div>
        <div class="doc-meta">
          <span>{{ doc.projectId }} / {{ doc.resourceId }}</span>
          <span class="badge">{{ doc.status }}</span>
        </div>
        <div class="doc-meta small">
          Обновлён: {{ new Date(doc.updatedAt).toLocaleString() }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { DocumentSummary } from '../types/documents';

defineProps<{
  documents: DocumentSummary[];
  selectedId?: string | null;
}>();

defineEmits<{
  select: [id: string];
  refresh: [];
}>();
</script>

<style scoped>
.panel {
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 shadow-lg shadow-slate-950/30;
  max-height: 500px;
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
  @apply text-sky-400 hover:text-sky-300 transition;
}

.document-list {
  @apply flex flex-col gap-3 overflow-y-auto max-h-[45vh] pr-1;
}

.document-card {
  @apply border border-slate-800 rounded-2xl p-4 bg-slate-950/40 cursor-pointer transition hover:border-slate-600 hover:bg-slate-900/60;
}

.document-card.active {
  @apply border-sky-500/60 bg-sky-500/10;
}

.doc-title {
  @apply font-semibold text-slate-100 mb-1;
}

.doc-meta {
  @apply flex items-center justify-between text-sm text-slate-400;
}

.doc-meta.small {
  @apply text-xs text-slate-500 mt-2;
}

.badge {
  @apply uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-200;
}

.empty-state {
  @apply border border-dashed border-slate-700 rounded-2xl p-6 text-center text-slate-400;
}
</style>

