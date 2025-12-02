<template>
  <div class="panel">
    <div class="panel-header">
      <h2>Очередь правок</h2>
      <button class="ghost" @click="$emit('refresh')" :disabled="!documentId">
        Обновить
      </button>
    </div>
    <div v-if="!documentId" class="empty-state">Нет выбранного документа</div>
    <template v-else>
      <div class="actions">
        <button class="primary" @click="$emit('apply')">Применить все</button>
        <button class="ghost" @click="$emit('reject')">Отклонить все</button>
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

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.updates-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 40vh;
  overflow-y: auto;
}

.update-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #f8fafc;
}

.update-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

pre {
  background: #0f172a;
  color: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  overflow: auto;
}

.badge {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fde68a;
  color: #78350f;
}

.primary {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  background: #16a34a;
  color: #fff;
  font-weight: 600;
}

.ghost {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
}

.ghost.danger {
  color: #b91c1c;
}

.empty-state {
  text-align: center;
  color: #475569;
  padding: 12px;
}
</style>

