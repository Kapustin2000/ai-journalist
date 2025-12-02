<template>
  <button @click="submit" :disabled="isSubmitting" class="disabled:opacity-50">
    {{ isSubmitting ? 'Submitting...' : t('editor.buttons.publish') }}
  </button>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner';
import { DocumentStatus } from '~/types/enums/documentstatus';
import type { FSDocument } from '~/types/FSDocument';

const { t } = useI18n();
const documentStore = useDocumentStore();

const props = defineProps({
  document: {
    type: Object as () => FSDocument,
    required: true,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
});

const document = computed(() => props.document);
const selectedLanguage = computed(() => props.selectedLanguage);
const isSubmitting = ref<boolean>(false);

const submit = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  toast.info('Submitting document...', {
    action: {
      label: 'Close',
    },
  });

  try {
    const response = await documentStore.updateDocument(
      {
        id: document.value.id,
        status: DocumentStatus.MODERATION,
      },
      selectedLanguage.value
    );

    if (response) {
      toast.success('Document submitted!', {
        action: {
          label: 'Close',
        },
      });
      document.value.status = response.status;
    } else {
      toast.error('Error during submit!', {
        action: {
          label: 'Close',
        },
      });
    }
  } catch (error) {
    console.error('Error during submit:', error);
    toast.error('Error during submit!', {
      action: {
        label: 'Close',
      },
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped></style>
