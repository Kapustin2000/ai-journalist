<template>
  <div
    v-if="editor"
    class="flex gap-4 w-full h-full flex-row flex-wrap relative"
  >
    <div class="flex flex-col gap-y-4 flex-grow-[999] basis-0">
      <div
        class="sticky top-3 z-10 max-h-[60px] flex gap-2 justify-center items-center"
      >
        <EditorHeaderToolbar :editor="editor" />
        <EditorHeaderCharacterCounter :editor="editor" />
        <EditorHeaderSaveStatus :document="document" :hasChanges="hasChanges" />
      </div>
      <div class="relative h-full overflow-hidden">
        <EditorContent :editor="editor" :form="form" />
        <EditorContentToolbar :editor="editor" pluginKey="toolbar" />
        <EditorContentToolbarLink :editor="editor" pluginKey="toolbarLink" />
      </div>
    </div>
    <div class="flex flex-col gap-y-4 lg:max-w-[300px] w-full">
      <EditorMenu
        :editor="editor"
        :selectedLanguage="selectedLanguage"
        :document="document"
        :form="form"
        :hasChanges="hasChanges"
        :loadDocument="loadDocument"
        :setLocale="setLocale"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import CharacterCount from '@tiptap/extension-character-count';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { useEditor } from '@tiptap/vue-3';
import Commands from '@/extensions/Commands';
import CustomLink from '@/extensions/CustomLink';
import ImageUploadNode from '@/extensions/ImageUpload';
import { VideoUploadNode } from '@/extensions/VideoUpload';
import suggestion from '@/extensions/Suggestion';
import type { FSDocument } from '~/types/FSDocument';
import type { CheckerResult, DraftForm } from '~/types/inputs/draftForm';
import { debounce } from 'lodash';
import type language from '~/lib/language';
import TextStyle from '@tiptap/extension-text-style';
import AdvertisingBlock from './Content/NodeView/AdvertisingBlock.vue';
import { SalesNode } from '~/extensions/Sales';

const limitCharacters = Infinity;
const { t, locale } = useI18n();

const props = defineProps({
  document: {
    type: Object as () => FSDocument,
    required: false,
  },
  loadDocument: {
    type: Function,
    required: true,
  },
  documentId: {
    type: String,
    required: false,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
  setLocale: {
    type: Function,
    required: true,
  },
});

const document = computed(() => props.document);
const documentFromDB = ref<idbRecord | null>(null);
const isDBLoaded = ref(false);

const selectedLanguage = computed(() => props.selectedLanguage);

const initialContent = computed(() => {
  const filteredContents = document.value?.DocumentDraftContents.filter(
    (content) => content.Language.code === selectedLanguage.value
  );

  if (!filteredContents || filteredContents.length === 0) {
    return '<p></p>';
  }

  const latestContent = filteredContents.reduce((latest, current) => {
    return new Date(current.createdAt) > new Date(latest.createdAt)
      ? current
      : latest;
  });

  return latestContent.content;
});

const initialForm = computed<DraftForm>(() => {
  const getFiltered = (
    field: 'title' | 'description' | 'seoTitle' | 'seoDescription'
  ) => {
    return (
      documentFromDB.value?.[field] ??
      document.value?.[field]?.find(
        (item) => item.language === selectedLanguage.value
      )?.content ??
      null
    );
  };

  return {
    title: getFiltered('title'),
    description: getFiltered('description'),
    seoTitle: getFiltered('seoTitle'),
    seoDescription: getFiltered('seoDescription'),
    image: document.value?.imageWeb ?? null,
  };
});

const form = ref<DraftForm>({ ...initialForm.value });
// const form = computed(() => ({ ...initialForm.value }));

const idbContent = computed(() => documentFromDB.value?.content ?? null);
const content = computed(() => idbContent.value ?? initialContent.value);
const editorContent = computed(() => editor.value?.getHTML() || '');

const editor = useEditor({
  content: content.value,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    // Color.configure({
    //   types: ['textStyle'],
    // }),
    // TextStyle,
    CharacterCount.configure({
      limit: limitCharacters,
    }),
    SalesNode,
    CustomLink.configure({
      openOnClick: false,
      defaultProtocol: 'https',
      HTMLAttributes: {
        title: null,
      },
    }),
    Underline,
    VideoUploadNode.configure({
      documentId: props.documentId,
    }),
    ImageUploadNode.configure({
      documentId: props.documentId,
    }),
    Commands.configure({
      suggestion,
    }),
    Placeholder.configure({
      placeholder: t('editor.start'),
    }),
  ],
});

const hasChanges = (): CheckerResult => {
  let hasFormChanges = false;
  const formChanges: Partial<
    Record<keyof DraftForm, { current: any; initial: any }>
  > = {};

  for (const key in form.value) {
    const typedKey = key as keyof DraftForm;
    if (
      JSON.stringify(form.value[typedKey]) !==
      JSON.stringify(initialForm.value[typedKey])
    ) {
      formChanges[typedKey] = {
        current: form.value[typedKey],
        initial: initialForm.value[typedKey],
      };
      hasFormChanges = true;
    }
  }

  const contentChanged = editorContent.value !== initialContent.value;

  return {
    hasChanges: hasFormChanges || contentChanged,
    changes: {
      ...formChanges,
      ...(contentChanged && {
        content: {
          current: editorContent.value,
          initial: initialContent.value,
        },
      }),
    },
  };
};

const saveDraftDebounced = debounce(async () => {
  if (!editor.value) return;

  console.log('Сохранение...');
  await saveDraftToDB(
    props.documentId ?? null,
    {
      ...(form.value.title && { title: form.value.title }),
      ...(form.value.description && { description: form.value.description }),
      ...(form.value.seoTitle && { seoTitle: form.value.seoTitle }),
      ...(form.value.seoDescription && {
        seoDescription: form.value.seoDescription,
      }),
      ...(editorContent.value && { content: editorContent.value }),
    },
    selectedLanguage.value
  );
}, 1000);

watch(
  [selectedLanguage, initialForm],
  () => {
    form.value = { ...initialForm.value };
  },
  { immediate: true }
);

watch(content, (newContent) => {
  if (editor.value && newContent) {
    editor.value.commands.setContent(newContent, false);
  }
});

watch(
  [form, editorContent],
  async (newForm) => {
    if (newForm && isDBLoaded.value) {
      console.log('Новый черновик');
      await saveDraftDebounced();
    }
  },
  { deep: true, immediate: false }
);

onMounted(async () => {
  try {
    documentFromDB.value = await getDraftFromDB(
      document.value?.id ?? null,
      selectedLanguage.value
    );
  } catch (error) {
    console.error('Failed to load from DB:', error);
  } finally {
    isDBLoaded.value = true;
  }
});

onBeforeUnmount(async () => {
  editor.value?.destroy();
});
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.primarios {
  animation: shade 2s ease-in-out infinite;
}
@keyframes shade {
  0%,
  100% {
    background-color: #2c2c2c;
    transform: scale(0.3);
  }

  40% {
    background-color: white;
    transform: scale(1);
  }
  50% {
    background-color: white;
    transform: scale(1);
  }
}

.primarios:nth-child(2) {
  animation-delay: 0.2s;
}
.primarios:nth-child(3) {
  animation-delay: 0.4s;
}
.primarios:nth-child(4) {
  animation-delay: 0.8s;
}
</style>
