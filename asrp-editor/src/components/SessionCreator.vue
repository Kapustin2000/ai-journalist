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
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 shadow-lg shadow-slate-950/40;
}

.panel-header h2 {
  @apply text-xl font-semibold text-slate-50;
}

.form {
  @apply flex flex-col gap-4;
}

label {
  @apply flex flex-col gap-2 text-sm text-slate-300;
}

input,
textarea {
  @apply bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-500/60;
  font: inherit;
}

textarea {
  resize: vertical;
}

.primary {
  @apply inline-flex justify-center items-center rounded-2xl px-4 py-3 bg-sky-500 text-slate-900 font-semibold transition disabled:opacity-50;
}
</style>

