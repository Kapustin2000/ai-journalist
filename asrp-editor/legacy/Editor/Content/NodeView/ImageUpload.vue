<template>
  <node-view-wrapper class="max-w-full w-full my-6">
    <input
      type="file"
      accept="image/*"
      @change="handleFileUpload"
      ref="fileInput"
      class="hidden"
    />
    <div v-if="!node.attrs.src" class="upload-placeholder">
      <button
        @click="triggerFileInput"
        class="bg-gray-300/40 hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-sm flex items-center justify-center w-full h-16 transition duration-150 ease-in-out"
      >
        <ImagePlus class="w-6 h-6 me-3 text-gray-400" />
        <span class="text-gray-400 text-sm">
          {{ t('editor.content.image.upload') }}
        </span>
      </button>
    </div>
    <div v-else class="relative group">
      <div class="rounded-lg overflow-hidden">
        <img
          :src="node.attrs.src"
          :alt="node.attrs.alt"
          class="w-full h-auto object-cover !my-1"
        />
        <div
          class="image-actions absolute top-1 left-0 right-0 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800/10 flex items-center justify-end px-2 space-x-2"
        >
          <button
            class="bg-gray-100/90 rounded shadow-xs h-6 px-3 text-black font-medium text-xs"
            @click="triggerFileInput"
          >
            {{ t('editor.content.image.replace') }}
          </button>
          <button
            class="bg-gray-800/90 rounded shadow-xs h-6 px-3 text-white font-medium text-xs"
            @click="removeImage"
          >
            {{ t('editor.content.image.remove') }}
          </button>
        </div>
      </div>
      <div class="flex items-center relative">
        <input
          type="text"
          v-model="inputText"
          @input="updateText"
          @keydown.enter.prevent="handleEnter"
          :placeholder="
            showAltText
              ? t('editor.content.image.alt.add')
              : t('editor.content.image.caption.add')
          "
          class="w-full px-1 py-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none transition duration-150 ease-in-out placeholder-gray-400"
        />
        <button
          @click="toggleAltText"
          class="absolute right-0 bottom-1 bg-transparent text-gray-900 dark:text-gray-400 text-[10px] font-medium px-2 py-1 rounded transition duration-150 ease-in-out flex items-center"
        >
          <Icon
            :name="showAltText ? 'mdi:text-short' : 'mdi:text-recognition'"
            class="size-3 me-1"
          />
          {{
            showAltText
              ? t('editor.content.image.caption.title')
              : t('editor.content.image.alt.title')
          }}
        </button>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper } from '@tiptap/vue-3';
import { Editor } from '@tiptap/core';
import { onMounted, watch } from 'vue';
import ImagePlus from '~/assets/svg/editor/ImagePlus.vue';
import { useDocumentContentStore } from '~/stores/documentContent';

const { t, locale } = useI18n();
const route = useRoute();
const documentId = ref(route.query.id);

const documentContentStore = useDocumentContentStore();

const props = defineProps<{
  node: {
    attrs: {
      src: string | null;
      alt: string | undefined;
      caption: string | null;
      documentId: string | undefined;
    };
  };
  updateAttributes: (
    attrs: Partial<{
      src: string | null;
      alt: string | undefined;
      caption: string | null;
      documentId: string | undefined;
    }>
  ) => void;
  editor: Editor;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const caption = ref(props.node.attrs.caption || '');
const altText = ref(props.node.attrs.alt || '');
const src = ref(props.node.attrs.src || null);
const showAltText = ref(false);

const inputText = computed({
  get: () => (showAltText.value ? altText.value : caption.value),
  set: (value: string) => {
    if (showAltText.value) {
      altText.value = value;
    } else {
      caption.value = value;
    }
  },
});

const handleEnter = () => {
  updateText();
  props.editor.commands.focus();
  props.editor.commands.enter();
};

const updateText = () => {
  showAltText.value ? updateAltText() : updateCaption();
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    if (!documentId.value) {
      console.error('Document ID is required');
      return;
    }
    try {
      const path = await documentContentStore.uploadImage(
        file,
        documentId.value as string
      );

      const fullPath = `https://asrp.media/storage/${path}`;
      props.updateAttributes({
        src: fullPath,
        alt: file.name,
      });
    } catch (error) {}
    // try {
    //   const response = documentContentStore.uploadImage(
    //     file,
    //   );
    // } catch (error) {}
  }
};

const removeImage = () => {
  props.updateAttributes({
    src: null,
    alt: undefined,
    caption: null,
  });
  caption.value = '';
  altText.value = '';
};

const updateCaption = () => {
  props.updateAttributes({
    caption: caption.value,
  });
};

const updateAltText = () => {
  props.updateAttributes({
    alt: altText.value,
  });
};

const toggleAltText = () => {
  showAltText.value = !showAltText.value;
};

watch(
  () => props.node.attrs.caption,
  (newCaption) => {
    caption.value = newCaption || '';
  }
);

watch(
  () => props.node.attrs.alt,
  (newAltText) => {
    altText.value = newAltText || '';
  }
);

watch(
  () => props.node.attrs.src,
  (newSrc) => {
    src.value = newSrc || null;
  }
);

// watch(
//   () => props.node.attrs,
//   (newAttrs) => {
//     console.log("Node attributes updated:", newAttrs); // Логируем обновленные атрибуты
//   },
//   { deep: true }
// );

onMounted(() => {
  props.editor.commands.blur();
});
</script>
