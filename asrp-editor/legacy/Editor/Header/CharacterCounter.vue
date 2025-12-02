<template>
  <div
    id="character-counter"
    class="flex justify-between items-center text-sm bg-primary-foreground w-max rounded-md shadow-md p-3"
  >
    {{ editor.storage.characterCount.characters() }} /
    {{ limitCharacters === Infinity ? '&infin;' : limitCharacters }}
    {{ t('editor.limitCharacters.characters.title') }}
    <br />
    {{ editor.storage.characterCount.words() }}
    {{ t('editor.limitCharacters.words.title') }}
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

const { t, locale } = useI18n();

const props = defineProps({
  editor: {
    type: Object as () => Editor,
    required: true,
  },
  limitCharacters: {
    type: Number,
    required: true,
    default: Infinity,
  },
});
</script>

<style scoped></style>
