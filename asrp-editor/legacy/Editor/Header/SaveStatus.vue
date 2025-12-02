<template>
  <div
    class="h-full flex justify-between items-center bg-primary-foreground w-max rounded-md shadow-md p-3"
  >
    <div class="relative group">
      <div class="shrink">
        <XCircle v-if="hasUnsavedChanges" class="text-red-500 w-6 h-6" />
        <CheckCircle2 v-else class="text-green-500 w-6 h-6" />
      </div>
      <span
        class="absolute left-1/2 -translate-x-1/2 bottom-full whitespace-nowrap mb-2 px-2 py-1 text-xs text-white bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {{ hasUnsavedChanges ? 'Статья не сохранена' : 'Статья сохранена' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle } from 'lucide-vue-next';
import { computed } from 'vue';
import type { FSDocument } from '~/types/FSDocument';

const props = defineProps({
  hasChanges: {
    type: Function,
    required: true,
    validator: (value: Function) => typeof value === 'function',
  },
  document: {
    type: Object as () => FSDocument,
    required: false,
    default: null,
  },
});

const hasUnsavedChanges = computed(() => {
  try {
    const { hasChanges } = props.hasChanges();
    return hasChanges || !props.document;
  } catch {
    return true;
  }
});
</script>

<style scoped></style>
