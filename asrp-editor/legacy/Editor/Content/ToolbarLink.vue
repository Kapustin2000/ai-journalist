<template>
  <BubbleMenu
    v-if="editor"
    :editor="editor"
    :tippy-options="{
      duration: 100,
      interactive: true,
      zIndex: 11,
    }"
    :plugin-key="pluginKey"
    :key="pluginKey"
    :should-show="shouldShow"
    class="toolbar-link w-max flex bg-primary-foreground border border-border rounded-md shadow-md p-2.5"
  >
    <div
      v-if="!isEditing"
      class="flex items-center relative flex-row divide-x divide-border"
    >
      <div class="max-w-[200px] truncate pe-3">
        <a :href="localLinkUrl || '#'" target="_blank" class="link">
          {{ localLinkUrl }}
        </a>
      </div>
      <div class="flex items-center flex-row gap-x-3 ps-3">
        <button
          @click="editLink"
          :title="t('editor.toolbar.link.edit.title')"
          class="flex items-center text-md px-2.5 py-1.5 rounded hover:bg-secondary transition duration-150 cursor-pointer"
        >
          <Edit class="w-4 h-4" />
        </button>
        <button
          @click="deleteLink"
          :title="t('editor.toolbar.link.delete.title')"
          class="flex items-center text-md px-2.5 py-1.5 rounded hover:bg-secondary transition duration-150 cursor-pointer"
        >
          <Delete class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-y-2.5 max-w-[300px] w-full" v-else>
      <div>
        <label for="linkUrl">
          {{ t('editor.toolbar.link.label_url.title') }}
        </label>
        <input
          id="linkUrl"
          v-model="localLinkUrl"
          type="text"
          :placeholder="t('editor.toolbar.link.label_url.placeholder')"
          class="border p-1 rounded w-full outline-none"
        />
      </div>
      <div>
        <label for="linkTitle">
          {{ t('editor.toolbar.link.label_title.title') }}
        </label>
        <input
          id="linkTitle"
          v-model="localLinkTitle"
          type="text"
          :placeholder="t('editor.toolbar.link.label_title.placeholder')"
          class="border p-1 rounded w-full outline-none"
        />
      </div>
      <div class="flex gap-x-3">
        <button
          @click="isEditing = false"
          class="w-full cursor-pointer hover:bg-secondary transition duration-150 bg-primary-foreground border border-border rounded px-2 py-1"
        >
          Назад
        </button>
        <button
          @click="updateLink"
          :disabled="!localLinkUrl"
          class="w-full bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-2 py-1"
        >
          {{ t('editor.toolbar.link.update.title') }}
        </button>
      </div>
    </div>
  </BubbleMenu>
</template>

<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3';
import { Editor } from '@tiptap/core';
import Edit from '~/assets/svg/editor/Edit.vue';
import Delete from '~/assets/svg/editor/Delete.vue';
import type { EditorView } from '@tiptap/pm/view';
import type { EditorState } from '@tiptap/pm/state';

const isEditing = ref(false);
const { t, locale } = useI18n();

const props = defineProps<{
  editor?: Editor;
  pluginKey?: string;
}>();

interface ShouldShowProps {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
}

const localLinkUrl = ref<string | null>(null);
const localLinkTitle = ref<string | null>(null);

const shouldShow = ({ editor, from, to }: ShouldShowProps) => {
  return from === to && editor.isActive('link');
};
const updateLink = () => {
  if (localLinkUrl.value) {
    if (!/^https?:\/\//i.test(localLinkUrl.value)) {
      localLinkUrl.value = `https://${localLinkUrl.value}`;
    }

    props.editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: localLinkUrl.value,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: 'link',
      })
      .run();

    if (localLinkTitle.value) {
      props.editor
        ?.chain()
        .focus()
        .updateAttributes('link', { title: localLinkTitle.value })
        .run();
    }

    resetLinkEditor();
  } else {
    alert('URL is required.');
  }
};
const editLink = () => {
  isEditing.value = true;
};
const deleteLink = () => {
  props.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
};
watchEffect(() => {
  if (props.editor && !isEditing.value) {
    const { href, title } = props.editor.getAttributes('link');
    localLinkUrl.value = href || null;
    localLinkTitle.value = title || null;
  }
});
const resetLinkEditor = () => {
  localLinkUrl.value = null;
  localLinkTitle.value = null;
  isEditing.value = false;
};
</script>
