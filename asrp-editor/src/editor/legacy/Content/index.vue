<template>
  <div
    class="w-full h-full flex flex-col gap-y-4 *:w-full *:flex *:flex-col *:gap-y-4 *:p-4 *:shadow-md *:bg-primary-foreground *:rounded-md"
  >
    <div class="min-h-[60dvh]">
      <div class="block">
        <textarea
          v-model="form.title"
          v-auto-resize
          class="w-full block resize-none disabled:cursor-not-allowed disabled:opacity-50 text-3xl px-4 font-bold focus:ring-0 outline-none focus:outline-none border-none bg-transparent"
          name="title"
          id="editor-title"
          :placeholder="t('editor.meta.article_title.title')"
        />
      </div>

      <EditorContentImageUpload :form="form" />

      <EditorContentTipTap
        id="editor-content"
        :editor="editor"
        class="text-black dark:text-white w-full h-full flex-grow break-all"
      />
    </div>
    <div class="h-auto">
      <div class="flex flex-col gap-3">
        <label
          for="editor-brief"
          class="block text-sm md:text-base font-medium leading-6"
        >
          {{ t('editor.meta.brief_desc.title') }}
        </label>
        <div id="editor-brief" class="block border border-border rounded-[4px]">
          <textarea
            v-model="form.description"
            v-auto-resize
            class="w-full min-h-20 block resize-none disabled:cursor-not-allowed disabled:opacity-50 text-md p-2 focus:ring-0 outline-none focus:outline-none border-none bg-transparent"
            name="description"
            id="description"
            :placeholder="t('editor.meta.brief_desc.placeholder')"
          ></textarea>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <label
          for="title"
          class="block text-sm md:text-base font-medium leading-6"
        >
          {{ t('editor.meta.seo_title.title') }}
        </label>
        <div
          id="editor-seo-title"
          class="block border border-border rounded-[4px]"
        >
          <textarea
            v-model="form.seoTitle"
            v-auto-resize
            class="w-full min-h-20 block resize-none disabled:cursor-not-allowed disabled:opacity-50 text-md p-2 focus:ring-0 outline-none focus:outline-none border-none bg-transparent"
            name="title"
            id="title"
            :placeholder="t('editor.meta.seo_title.placeholder')"
          ></textarea>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <label
          for="metaDescription"
          class="block text-sm md:text-base font-medium leading-6"
        >
          {{ t('editor.meta.seo_desc.title') }}
        </label>
        <div
          id="editor-seo-description"
          class="block border border-border rounded-[4px]"
        >
          <textarea
            v-model="form.seoDescription"
            v-auto-resize
            class="w-full min-h-20 block resize-none disabled:cursor-not-allowed disabled:opacity-50 text-md p-2 focus:ring-0 outline-none focus:outline-none border-none bg-transparent"
            name="metaDescription"
            id="metaDescription"
            :placeholder="t('editor.meta.seo_desc.placeholder')"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { EditorContent as EditorContentTipTap } from '@tiptap/vue-3';
import type { DraftForm } from '~/types/inputs/draftForm';

const { t } = useI18n();
const props = defineProps({
  editor: {
    type: Object as () => Editor,
    required: true,
  },
  form: {
    type: Object as () => DraftForm,
    required: true,
  },
});
</script>

<style scoped></style>
