<template>
  <div class="upload-container">
    <input
      type="file"
      @change="handleFileUpload"
      ref="fileInput"
      class="hidden"
      accept="image/*"
    />
    <div
      v-if="form.image === null || form.image === undefined"
      class="upload-placeholder"
    >
      <button
        id="editor-image"
        @click="triggerFileInput"
        class="bg-secondary text-muted-foreground hover:bg-secondary/50 cursor-pointer font-medium py-2 px-4 rounded-lg shadow-sm flex items-center justify-center w-full h-16 transition duration-150 ease-in-out"
      >
        <ImagePlus class="w-6 h-6 me-3 text-muted-foreground" />
        <span class="text-muted-foreground text-sm">
          {{ t('editor.content.poster.upload') }}
        </span>
      </button>
    </div>
    <div v-else class="relative group">
      <div class="rounded-lg overflow-hidden">
        <img
          :src="imagePreview"
          alt="Uploaded image"
          class="w-full h-auto object-cover rounded-lg border border-gray-200 dark:border-gray-700"
        />
      </div>
      <button
        @click="removeImage"
        class="absolute top-2 right-1 bg-gray-800/90 text-white font-medium text-xs rounded-full px-2 py-1"
      >
        {{ t('editor.content.poster.remove') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImagePlus from '~/assets/svg/editor/ImagePlus.vue';
import type { DraftForm } from '~/types/inputs/draftForm';
import type { Media } from '~/types/media';

const { t } = useI18n();
const props = defineProps({
  form: {
    type: Object as () => DraftForm,
    required: true,
  },
});

const fileInput = ref<HTMLInputElement | null>(null);
const form = computed(() => props.form);

const removeImage = () => {
  form.value.image = null;
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;
  form.value.image = file;
};

const imagePreview = computed(() => {
  if (!form.value.image) return;

  if (form.value.image instanceof File) {
    return URL.createObjectURL(form.value.image as File);
  } else {
    let originalImage = form.value.image as Media[];
    if (originalImage.find((img) => img.isOriginal)) {
      return `https://asrp.media/storage${
        originalImage.find((img) => img.isOriginal)?.path
      }`;
    } else if (originalImage.length > 0) {
      return `https://asrp.media/storage${originalImage[0].path}`;
    }
  }

  return;
});

const triggerFileInput = () => {
  fileInput.value?.click();
};
</script>

<style scoped></style>
