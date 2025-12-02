<script setup lang="ts">
import { toast } from 'vue-sonner';
import type { FSDocument } from '~/types/FSDocument';

const route = useRoute();
const documentId = ref<string | undefined>(route.query.id as string);
const document = ref<FSDocument | undefined>(undefined);
const documentStore = useDocumentStore();
const { t, locale } = useI18n();
const selectedLanguage = ref<string>(locale.value);
const loading = ref<boolean>(!!documentId.value);

const loadDocument = async (id: string, showLoader: boolean = true) => {
  try {
    if (showLoader) loading.value = true;
    document.value = await documentStore.findDocument(id, locale.value, true);
  } catch (error) {
    console.error('Error loading document:', error);
  } finally {
    if (showLoader)
      setTimeout(() => {
        loading.value = false;
      }, 1000);
  }
};

const setLocale = (locale: string) => {
  selectedLanguage.value = locale;
};

const resetEditor = async () => {
  document.value = undefined;
  documentId.value = undefined;
};

watch(
  () => route.query.id,
  async (newId) => {
    if (newId) {
      documentId.value = newId as string;
      await loadDocument(documentId.value);
    } else {
      await resetEditor();
    }
  },
  { immediate: true }
);

useSeoMeta({
  title: 'Edit Article - Enhance Your Content',
  ogTitle: 'Edit Article - Enhance Your Content',
  description:
    'Easily edit your articles to improve clarity and engagement. Utilize our intuitive tools to refine your writing and captivate your audience.',
  ogDescription:
    'Easily edit your articles to improve clarity and engagement. Utilize our intuitive tools to refine your writing and captivate your audience.',
});

onMounted(async () => {
  if (documentId.value) {
    await loadDocument(documentId.value);
  }
});
</script>

<template>
  <NuxtLayout name="main">
    <div class="w-full h-full flex relative">
      <Transition>
        <div
          v-if="loading"
          class="flex justify-center items-center h-full w-full text-lg font-semibold"
        >
          <div
            class="flex gap-x-1 items-baseline text-white text-[18px] leading-[170%]"
          >
            <span>Загружаем документ</span>
            <div class="flex items-end gap-1">
              <div
                class="w-[2px] h-[2px] rounded-full bg-white primarios"
              ></div>
              <div
                class="w-[2px] h-[2px] rounded-full bg-white primarios"
              ></div>
              <div
                class="w-[2px] h-[2px] rounded-full bg-white primarios"
              ></div>
              <div
                class="w-[2px] h-[2px] rounded-full bg-white primarios"
              ></div>
            </div>
          </div>
        </div>
      </Transition>
      <Transition>
        <Editor
          v-if="!loading"
          :documentId="documentId"
          :document="document"
          :loadDocument="loadDocument"
          :selectedLanguage="selectedLanguage"
          :setLocale="setLocale"
        />
      </Transition>
    </div>
  </NuxtLayout>
</template>

<style>
.tiptap {
  height: 100%;
  width: 100%;
  padding: 1rem;
  outline: none;
  pointer-events: auto;
}

.tiptap p {
  line-height: 1.6;
  margin: 1rem 0;
}

.tiptap a {
  color: black;
}

.dark .tiptap a {
  color: white;
}

.tiptap h1,
.tiptap h2,
.tiptap h3,
.tiptap h4,
.tiptap h5,
.tiptap h6 {
  width: 100%;
  margin: 1.5rem 0 1rem;
  font-weight: bold;
}

.tiptap h1 {
  font-size: 2rem;
}

.tiptap h2 {
  font-size: 1.75rem;
}

.tiptap h3 {
  font-size: 1.5rem;
}

.tiptap a.link {
  font-weight: bold;
  text-decoration: underline;
}

.tiptap h4 {
  font-size: 1.25rem;
}

.tiptap h5 {
  font-size: 1rem;
}

.tiptap h6 {
  font-size: 0.875rem;
}

.tiptap ul {
  list-style: disc;
  padding-inline-start: 1.5rem;
  margin: 1rem 0;
}

.tiptap ul li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.tiptap ol {
  list-style: decimal;
  padding-inline-start: 1.5rem;
  margin: 1rem 0;
}

.tiptap blockquote {
  border-inline-start: 4px solid #bebebe;
  padding-inline-start: 1rem;
  color: #666;
  font-style: italic;
  margin: 1rem 0;
}

.dark .tiptap blockquote {
  color: #ccccccb4;
}

.tiptap ul,
.tiptap ol {
  margin: 1rem 0 1rem 2rem;
}

.tiptap li {
  margin-bottom: 0.5rem;
}

.tiptap p code {
  color: rgb(231, 41, 161);
  background: #fcf8f8;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.tiptap pre {
  background-color: #fcf8f8cc;
  border-radius: 6px;
  margin: 1em 0;
  padding: 10px;
  overflow: hidden;
}

.tiptap pre code {
  display: block;
  padding: 1em;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  line-height: 1.5;
  color: #24292e;
}

.tiptap hr {
  border: 0;
  border-top: 1px solid #ccc;
  margin: 2rem 0;
}

.tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.tiptap a {
  color: #3498db;
  text-decoration: none;
}

.tiptap a:hover {
  text-decoration: underline;
}

.tiptap p.is-empty::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.ProseMirror-selectednode img {
  border: 2px solid #f15bff;
}

/* Syntax highlighting */
.hljs-comment,
.hljs-quote {
  color: #6a737d;
  font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag {
  color: #d73a49;
}

.hljs-string,
.hljs-attr,
.hljs-variable,
.hljs-template-variable {
  color: #032f62;
}

.hljs-number,
.hljs-literal {
  color: #005cc5;
}

.hljs-type,
.hljs-built_in,
.hljs-builtin-name,
.hljs-symbol {
  color: #e36209;
}

.hljs-regexp,
.hljs-link {
  color: #22863a;
}

.hljs-title,
.hljs-section,
.hljs-tag,
.hljs-name {
  color: #6f42c1;
}

.hljs-class .hljs-title,
.hljs-title.class_ {
  color: #6f42c1;
}

.hljs-strong {
  font-weight: bold;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-addition {
  color: #22863a;
  background-color: #f0fff4;
}

.hljs-deletion {
  color: #b31d28;
  background-color: #ffeef0;
}
</style>
