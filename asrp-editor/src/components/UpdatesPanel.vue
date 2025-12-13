<template>
  <div class="panel">
    <div class="panel-header">
      <div>
        <p class="label">Очередь</p>
        <h2>Правки</h2>
      </div>
      <button class="ghost" @click="$emit('refresh')" :disabled="!documentId">
        Обновить
      </button>
    </div>
    <div v-if="!documentId" class="empty-state">Нет выбранного документа</div>
    <template v-else>
      <div class="actions">
        <button class="primary" @click="$emit('apply')">Применить все</button>
        <button class="secondary" @click="$emit('reject')">Отклонить все</button>
        <button class="ghost danger" @click="$emit('clear')">Очистить</button>
      </div>
      <ul class="updates-list">
        <li v-for="update in updates" :key="update.id" class="update-item">
          <div class="update-meta">
            <strong>{{ update.type }}</strong>
            <span class="badge">{{ update.state }}</span>
            <span>{{ new Date(update.createdAt).toLocaleString() }}</span>
          </div>
          <p v-if="update.note">{{ update.note }}</p>
          <details>
            <summary>Payload</summary>
            <pre>{{ pretty(update.payload) }}</pre>
          </details>
        </li>
      </ul>
      <div v-if="!updates.length" class="empty-state">Очередь пуста</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DocumentUpdate } from '../types/documents';

defineProps<{
  documentId?: string | null;
  updates: DocumentUpdate[];
}>();

defineEmits<{
  refresh: [];
  apply: [];
  reject: [];
  clear: [];
}>();

const pretty = (value: unknown) => JSON.stringify(value, null, 2);
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
  @apply text-sky-400 hover:text-sky-300 transition disabled:opacity-40;
}

.actions {
  @apply flex flex-wrap items-center gap-3;
}

.primary {
  @apply inline-flex items-center px-4 py-2 rounded-2xl bg-emerald-500/90 text-slate-900 font-semibold;
}

.secondary {
  @apply inline-flex items-center px-4 py-2 rounded-2xl border border-slate-700 text-slate-200 hover:bg-slate-900/60 transition;
}

.ghost.danger {
  @apply text-rose-400 hover:text-rose-300;
}

.updates-list {
  @apply flex flex-col gap-3 overflow-y-auto max-h-[40vh] pr-1;
}

.update-item {
  @apply border border-slate-800 rounded-2xl p-4 bg-slate-950/50;
}

.update-meta {
  @apply flex items-center gap-3 flex-wrap text-sm text-slate-400 mb-2;
}

.update-meta strong {
  @apply text-slate-100;
}

.badge {
  @apply uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-200;
}

pre {
  @apply bg-slate-950 text-slate-50 p-3 rounded-xl border border-slate-800 overflow-auto mt-2;
}

.empty-state {
  @apply border border-dashed border-slate-700 rounded-2xl p-6 text-center text-slate-400;
}
</style>

