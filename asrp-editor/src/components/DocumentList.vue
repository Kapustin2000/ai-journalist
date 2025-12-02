<template>
  <div class="panel">
    <div class="panel-header">
      <h2>Документы</h2>
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

.document-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 40vh;
  overflow-y: auto;
}

.document-card {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.document-card:hover {
  border-color: #94a3b8;
}

.document-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.doc-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.doc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #475569;
}

.doc-meta.small {
  font-size: 0.8rem;
}

.badge {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 999px;
  background: #c7d2fe;
  color: #1e1b4b;
}

.ghost {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
}

.empty-state {
  padding: 16px;
  border: 1px dashed #cbd5f5;
  border-radius: 10px;
  text-align: center;
  color: #475569;
}
</style>

