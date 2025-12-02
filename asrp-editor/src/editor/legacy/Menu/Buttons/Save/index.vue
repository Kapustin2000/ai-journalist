<template>
  <button @click="save" :disabled="isSaving" class="disabled:opacity-50">
    {{ isSaving ? 'Saving...' : t('editor.buttons.save') }}
  </button>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { toast } from 'vue-sonner';
import type { FSDocument } from '~/types/FSDocument';
import type { CheckerResult, DraftForm } from '~/types/inputs/draftForm';
import type { MultiLanguage } from '~/types/MultiLanguage';
import languageLib from '~/lib/language';

const { t } = useI18n();
const documentStore = useDocumentStore();
const documentContentStore = useDocumentContentStore();

interface documentRecord {
  title?: MultiLanguage;
  description?: MultiLanguage;
  seoTitle?: MultiLanguage;
  seoDescription?: MultiLanguage;
  image?: File;
}

const props = defineProps({
  document: {
    type: Object as () => FSDocument,
    required: false,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
  editor: {
    type: Object as () => Editor,
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
});

const document = computed(() => props.document);
const selectedLanguage = computed(() => props.selectedLanguage);
const editor = computed(() => props.editor);
const form = computed(() => props.form);
const router = useRouter();
const route = useRoute();

const isSaving = ref<boolean>(false);

const save = async () => {
  if (isSaving.value) return;
  const { hasChanges, changes }: CheckerResult = props.hasChanges();

  if (!hasChanges) {
    return toast.info('No changes detected!', {
      action: {
        label: 'Close',
      },
    });
  }

  isSaving.value = true;

  toast.info('Saving document...', {
    action: {
      label: 'Close',
    },
  });

  let documentId: string | undefined;

  try {
    const record: Partial<documentRecord> = {
      ...(changes.title && {
        title: {
          language: selectedLanguage.value,
          content: changes.title.current,
        },
      }),
      ...(changes.description && {
        description: {
          language: selectedLanguage.value,
          content: changes.description.current,
        },
      }),
      ...(changes.seoTitle && {
        seoTitle: {
          language: selectedLanguage.value,
          content: changes.seoTitle.current,
        },
      }),
      ...(changes.seoDescription && {
        seoDescription: {
          language: selectedLanguage.value,
          content: changes.seoDescription.current,
        },
      }),
      ...(changes.image &&
        changes.image.current instanceof File && {
          imageWeb: changes.image.current,
        }),
    };

    if (document.value) {
      documentId = document.value.id;

      if (Object.keys(record).length > 0) {
        await documentStore.updateDocument(
          { id: documentId, ...record },
          selectedLanguage.value
        );
      }
    } else {
      const response = await documentStore.createDraft(
        record,
        selectedLanguage.value
      );

      documentId = response.id;

      if (!documentId) throw new Error('Failed to create document');

      router.push({
        path: route.path,
        query: { ...route.query, id: documentId },
      });
    }

    if (changes.content && documentId) {
      await documentContentStore.createContent({
        documentId,
        content: changes.content.current,
        languageId: languageLib.getByCode(selectedLanguage.value)?.id,
      });
    }

    toast.success('Document saved successfully!', {
      action: { label: 'Close' },
    });
  } catch (error) {
    console.error('Error during save:', error);
    toast.error('Error during save!', {
      action: {
        label: 'Close',
      },
    });
  } finally {
    if (documentId) props.loadDocument(documentId, false);
    isSaving.value = false;
  }
};
</script>

<style scoped></style>
