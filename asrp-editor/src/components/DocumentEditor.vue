<template>
  <div v-if="document" class="legacy-shell">
    <div class="flex flex-col lg:flex-row gap-6 w-full">
      <div class="flex-1 flex flex-col gap-4">
        <header class="legacy-header">
          <div class="flex items-center gap-3">
            <span class="status-pill">{{ status }}</span>
            <p class="text-sm text-slate-400">ID: {{ document.id.slice(0, 8) }}</p>
          </div>
          <div class="header-actions">
            <div class="character">
              <span class="text-xs uppercase tracking-wide text-slate-400">Символов</span>
              <strong class="text-lg">{{ characterCount }}</strong>
            </div>
            <select v-model="nextStatus" class="status-select">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
            <button class="secondary" @click="emit('change-status', nextStatus)">
              Обновить статус
            </button>
          </div>
        </header>

        <div class="editor-card">
          <div class="flex flex-col gap-2">
            <label for="doc-title" class="text-slate-400 text-sm uppercase tracking-wide">
              Заголовок
            </label>
            <textarea
              id="doc-title"
              v-model="title"
              rows="2"
              class="title-input"
              placeholder="Введите заголовок материала"
            ></textarea>
          </div>

          <div v-if="editor" class="legacy-editor">
            <div class="toolbar">
              <button
                v-for="btn in toolbarButtons"
                :key="btn.label"
                :class="['toolbar-btn', { active: btn.isActive?.() }]"
                @click="btn.onClick()"
                type="button"
              >
                {{ btn.label }}
              </button>
            </div>
            <EditorContent class="editor-surface" :editor="editor" />
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <label>Краткое описание</label>
            <textarea
              v-model="description"
              class="meta-text"
              rows="3"
              placeholder="Кратко объясните, о чём материал"
            ></textarea>
          </div>
          <div class="meta-card">
            <label>SEO Title</label>
            <textarea
              v-model="seoTitle"
              class="meta-text"
              rows="2"
              placeholder="Заголовок для SEO"
            ></textarea>
          </div>
          <div class="meta-card">
            <label>SEO Description</label>
            <textarea
              v-model="seoDescription"
              class="meta-text"
              rows="3"
              placeholder="Описание для поисковиков"
            ></textarea>
          </div>
          <div class="meta-card">
            <label>Комментарий к сохранению</label>
            <textarea
              v-model="note"
              class="meta-text"
              rows="2"
              placeholder="Например, «Обновил лид»"
            ></textarea>
          </div>
        </div>

        <div class="actions">
          <button class="primary" :disabled="!canSave" @click="handleSave">Сохранить</button>
          <button class="ghost" type="button" @click="resetEditor">Сбросить</button>
        </div>
      </div>

      <aside class="sidebar">
        <section class="sidebar-card">
          <h3>Быстрые действия</h3>
          <button class="primary w-full" :disabled="!canSave" @click="handleSave">
            Сохранить изменения
          </button>
          <button class="secondary w-full" @click="$emit('apply-updates')">
            Применить все правки
          </button>
        </section>
        <section class="sidebar-card">
          <h3>Информация</h3>
          <p class="info-row">
            <span class="label">Проект</span>
            <span>{{ document.projectId }}</span>
          </p>
          <p class="info-row">
            <span class="label">Ресурс</span>
            <span>{{ document.resourceId }}</span>
          </p>
          <p class="info-row">
            <span class="label">Обновлён</span>
            <span>{{ new Date(document.updatedAt).toLocaleString() }}</span>
          </p>
        </section>
        <section class="sidebar-card">
          <h3>Язык</h3>
          <div class="language-row">
            <span>Русский</span>
            <button class="ghost" type="button">Сменить</button>
          </div>
        </section>
      </aside>
    </div>
  </div>
  <div v-else class="panel">
    <div class="empty-state">Выберите документ из списка слева, чтобы начать редактирование.</div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import { computed, ref, watch } from 'vue';
import type { DocumentRecord, DocumentStatus } from '../types/documents';
import { DEFAULT_EDITOR_DOC } from '../editor/defaultContent';

const TIPTAP_BLOCK_TYPE = 'tiptap';

const props = defineProps<{
  document: DocumentRecord | null;
  status: DocumentStatus | null;
}>();

const emit = defineEmits<{
  save: [
    payload: {
      title?: string | null;
      blocks: any[];
      metadata?: Record<string, any>;
      note?: string;
    },
  ];
  'change-status': [status: DocumentStatus];
  'apply-updates': [];
}>();

const title = ref('');
const description = ref('');
const seoTitle = ref('');
const seoDescription = ref('');
const note = ref('Manual edit');
const nextStatus = ref<DocumentStatus>('draft');
const dirty = ref(false);

const editor = useEditor({
  content: DEFAULT_EDITOR_DOC,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    Placeholder.configure({
      placeholder: 'Напишите вводный абзац...',
    }),
    CharacterCount.configure(),
  ],
  onUpdate: () => {
    dirty.value = true;
  },
});

const document = computed(() => props.document);

const characterCount = computed(() => editor.value?.storage.characterCount.characters() ?? 0);

const toolbarButtons = [
  {
    label: 'Ж',
    onClick: () => editor.value?.chain().focus().toggleBold().run(),
    isActive: () => editor.value?.isActive('bold'),
  },
  {
    label: 'К',
    onClick: () => editor.value?.chain().focus().toggleItalic().run(),
    isActive: () => editor.value?.isActive('italic'),
  },
  {
    label: 'U',
    onClick: () => editor.value?.chain().focus().toggleUnderline().run(),
    isActive: () => editor.value?.isActive('underline'),
  },
  {
    label: 'H1',
    onClick: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 1 }),
  },
  {
    label: '• List',
    onClick: () => editor.value?.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value?.isActive('bulletList'),
  },
  {
    label: '1. List',
    onClick: () => editor.value?.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value?.isActive('orderedList'),
  },
  {
    label: '—',
    onClick: () => editor.value?.chain().focus().setHorizontalRule().run(),
  },
];

const resolveContent = (doc: DocumentRecord | null) => {
  if (!doc) {
    return DEFAULT_EDITOR_DOC;
  }
  const block = doc.content?.blocks?.find((candidate) => candidate?.type === TIPTAP_BLOCK_TYPE);
  if (block && 'data' in block && block.data) {
    return block.data;
  }
  if (doc.content?.metadata?.html) {
    return doc.content.metadata.html;
  }
  return DEFAULT_EDITOR_DOC;
};

let isResetting = false;

const resetEditor = () => {
  isResetting = true;
  const metadata = document.value?.content?.metadata ?? {};
  title.value = document.value?.title ?? '';
  description.value = metadata.description ?? '';
  seoTitle.value = metadata.seoTitle ?? '';
  seoDescription.value = metadata.seoDescription ?? '';
  note.value = 'Manual edit';
  nextStatus.value = props.status ?? 'draft';
  dirty.value = false;
  if (editor.value) {
    editor.value.commands.setContent(resolveContent(document.value), false);
  }
  queueMicrotask(() => {
    isResetting = false;
  });
};

watch(
  () => [document.value?.id, props.status],
  () => {
    resetEditor();
  },
  { immediate: true },
);

watch([title, description, seoTitle, seoDescription, note], () => {
  if (!isResetting) {
    dirty.value = true;
  }
});

const canSave = computed(
  () =>
    !!document.value &&
    !!editor.value &&
    (dirty.value ||
      description.value !== (document.value?.content?.metadata?.description ?? '') ||
      seoTitle.value !== (document.value?.content?.metadata?.seoTitle ?? '') ||
      seoDescription.value !== (document.value?.content?.metadata?.seoDescription ?? '') ||
      title.value !== (document.value?.title ?? '')),
);

const handleSave = () => {
  if (!editor.value || !document.value) return;
  emit('save', {
    title: title.value,
    blocks: [
      {
        type: TIPTAP_BLOCK_TYPE,
        data: editor.value.getJSON(),
      },
    ],
    metadata: {
      html: editor.value.getHTML(),
      description: description.value,
      seoTitle: seoTitle.value,
      seoDescription: seoDescription.value,
    },
    note: note.value || undefined,
  });
  dirty.value = false;
};
</script>

<style scoped>
.legacy-shell {
  @apply bg-slate-950 text-slate-50 rounded-3xl p-6 border border-slate-800 shadow-xl;
}

.legacy-header {
  @apply bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4;
}

.status-pill {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-300 border border-emerald-500/30;
}

.header-actions {
  @apply flex flex-wrap items-center gap-3;
}

.character {
  @apply bg-slate-800/70 rounded-xl px-4 py-2 border border-slate-700;
}

.status-select {
  @apply bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200;
}

.editor-card {
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4;
}

.title-input {
  @apply bg-transparent border border-slate-800 rounded-2xl p-4 text-3xl font-semibold text-white focus:outline-none focus:border-sky-500/60;
}

.legacy-editor {
  @apply border border-slate-800 rounded-2xl overflow-hidden;
}

.toolbar {
  @apply flex flex-wrap gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800;
}

.toolbar-btn {
  @apply border border-transparent rounded-xl px-3 py-1 text-sm text-slate-200 bg-slate-800/60 hover:bg-slate-700/70 transition;
}

.toolbar-btn.active {
  @apply bg-sky-500/80 text-slate-900;
}

.editor-surface {
  min-height: 320px;
  @apply px-6 py-4 text-slate-100 leading-relaxed;
}

.meta-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.meta-card {
  @apply bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2;
}

.meta-card label {
  @apply text-sm uppercase tracking-wide text-slate-400;
}

.meta-text {
  @apply bg-transparent border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-sky-500/60;
}

.actions {
  @apply flex flex-wrap items-center gap-3;
}

.primary {
  @apply inline-flex justify-center items-center px-5 py-2.5 rounded-2xl bg-sky-500 text-slate-900 font-semibold transition disabled:opacity-50;
}

.secondary {
  @apply inline-flex justify-center items-center px-4 py-2 rounded-2xl border border-slate-700 text-slate-200 hover:bg-slate-900/60 transition;
}

.ghost {
  @apply inline-flex items-center text-sky-400 hover:text-sky-300 transition underline-offset-4;
}

.sidebar {
  @apply w-full lg:w-80 flex flex-col gap-4;
}

.sidebar-card {
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3;
}

.info-row {
  @apply flex items-center justify-between text-sm text-slate-300;
}

.info-row .label {
  @apply text-slate-500 uppercase tracking-wide text-xs;
}

.language-row {
  @apply flex items-center justify-between;
}

.panel,
.empty-state {
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-200;
}
</style>

