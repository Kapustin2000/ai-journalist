<template>
  <div class="panel">
    <div class="panel-header">
      <h2>Новая сессия</h2>
    </div>
    <form class="form" @submit.prevent="handleCreate">
      <label>
        <span>Project ID</span>
        <input v-model="projectId" required placeholder="media" />
      </label>
      <label>
        <span>Resource ID</span>
        <input v-model="resourceId" required placeholder="article-001" />
      </label>
      <label>
        <span>Title</span>
        <input v-model="title" placeholder="Черновик статьи" />
      </label>
      <label>
        <span>Комментарий</span>
        <textarea
          v-model="comment"
          rows="3"
          placeholder="О чём документ, для быстрого поиска"
        />
      </label>
      <button type="submit" class="primary" :disabled="pending">
        {{ pending ? 'Создаём...' : 'Создать / открыть' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  create: [
    payload: {
      projectId: string;
      resourceId: string;
      title?: string;
      comment?: string;
    },
  ];
}>();

const projectId = ref('media');
const resourceId = ref(`resource-${Date.now()}`);
const title = ref('Новый документ');
const comment = ref('');
const pending = ref(false);

const handleCreate = async () => {
  try {
    pending.value = true;
    emit('create', {
      projectId: projectId.value.trim(),
      resourceId: resourceId.value.trim(),
      title: title.value.trim(),
      comment: comment.value.trim() || undefined,
    });
  } catch (error) {
    alert('Не удалось создать сессию. Проверьте поля.');
  } finally {
    pending.value = false;
  }
};
</script>

<style scoped>
.panel {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e1e6ef;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
  color: #475569;
}

input,
textarea {
  border-radius: 8px;
  border: 1px solid #cbd5f5;
  padding: 8px 10px;
  font: inherit;
}

textarea {
  resize: vertical;
}

.primary {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}

.primary:disabled {
  opacity: 0.6;
}
</style>

