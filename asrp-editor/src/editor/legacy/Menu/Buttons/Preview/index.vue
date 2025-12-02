<template>
  <button v-if="document" @click="preview">
    {{ t('editor.buttons.preview') }}
  </button>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner';
import type { FSDocument } from '~/types/FSDocument';

const { t } = useI18n();

const props = defineProps({
  document: {
    type: Object as () => FSDocument,
    required: false,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
});
const selectedLanguage = computed(() => props.selectedLanguage);
const document = computed(() => props.document);

const preview = async () => {
  try {
    await navigateTo(
      `https://asrp.media/${selectedLanguage.value}/articles/${
        document.value?.slug.find(
          (item) => item.language === selectedLanguage.value
        )?.content
      }`,
      {
        open: {
          target: '_blank',
        },
      }
    );
    toast.success('Article opened!', {
      action: {
        label: 'Close',
      },
    });
  } catch (error) {
    console.error('Error during preview:', error);
    toast.error('Error during preview!', {
      action: {
        label: 'Close',
      },
    });
  }
};
</script>

<style scoped></style>
