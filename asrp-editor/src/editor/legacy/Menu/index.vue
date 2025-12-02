<template>
  <div
    class="min-w-[200px] flex flex-col gap-y-4 *:w-full *:flex *:flex-col *:gap-y-2 *:p-4 *:shadow-md *:bg-primary-foreground *:rounded-md"
  >
    <div
      class="*:bg-secondary *:border *:border-border *:rounded-md *:py-1.5 *:cursor-pointer *:hover:bg-secondary/50 *:transition *:duration-150"
    >
      <EditorMenuButtonsSave
        :document="document"
        :editor="editor"
        :form="form"
        :selectedLanguage="selectedLanguage"
        :hasChanges="hasChanges"
        :loadDocument="loadDocument"
      />
      <EditorMenuButtonsSubmit
        v-if="
          document &&
          DocumentStatusPriority[document.status] <
            DocumentStatusPriority[DocumentStatus.MODERATION]
        "
        :document="document"
        :selectedLanguage="selectedLanguage"
      />
      <EditorMenuButtonsPreview
        v-if="document"
        :document="document"
        :selectedLanguage="selectedLanguage"
      />
      <EditorMenuButtonsExport :editor="editor" />
      <!-- <button @click="console.log(editor.getHTML())">demo</button> -->
    </div>
    <div
      v-if="document"
      class="*:bg-secondary *:border *:border-border *:rounded-md *:py-2"
    >
      <EditorMenuLanguages
        :document="document"
        :selectedLanguage="selectedLanguage"
        :setLocale="setLocale"
      />
    </div>
    <div
      v-if="document"
      class="*:bg-secondary *:border *:border-border *:rounded-md *:py-2"
    >
      <EditorMenuHistory :document="document" :editor="editor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import {
  DocumentStatus,
  DocumentStatusPriority,
} from '~/types/enums/documentstatus';
import type { FSDocument } from '~/types/FSDocument';
import type { DraftForm } from '~/types/inputs/draftForm';

const props = defineProps({
  editor: {
    type: Object as () => Editor,
    required: true,
  },
  document: {
    type: Object as () => FSDocument,
    required: false,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
  form: {
    type: Object as () => DraftForm,
    required: true,
  },
  hasChanges: {
    type: Function,
    required: true,
  },
  loadDocument: {
    type: Function,
    required: true,
  },
  setLocale: {
    type: Function,
    required: true,
  },
});

const document = computed(() => props.document);
</script>

<style scoped></style>
