<template>
  <div class="panel">
    <div class="panel-header">
      <h2>История</h2>
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
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e1e6ef;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 40vh;
  overflow-y: auto;
}

.history-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #f8fafc;
}

.history-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

details {
  font-size: 0.85rem;
}

pre {
  background: #0f172a;
  color: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  overflow: auto;
}

.ghost {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: #475569;
  padding: 12px;
}
</style>

