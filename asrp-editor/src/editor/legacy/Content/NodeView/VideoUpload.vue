<template>
  <node-view-wrapper class="max-w-full w-full my-6">
    <input
      type="file"
      accept="video/*"
      @change="handleFileUpload"
      ref="fileInput"
      class="hidden"
    />
    <div v-if="!node.attrs.src" class="upload-placeholder">
      <div
        v-if="!uploading"
        class="bg-gray-300/30 dark:text-slate-300 text-gray-600 font-medium py-2 px-4 rounded-lg shadow-sm flex flex-col gap-2 items-center justify-center w-full h-full"
      >
        <button
          @click="triggerFileInput"
          class="bg-gray-300/40 text-gray-700 hover:bg-gray-100 hover:text-gray-400 font-medium py-2 px-4 rounded-lg shadow-sm flex items-center justify-center w-full h-16 transition duration-150 ease-in-out"
        >
          <VideoUpload class="w-6 h-6 mr-3" />
          <span class="text-sm"> Нажмите, чтобы загрузить видео </span>
        </button>
        <span>или вставьте ссылку</span>
        <div class="w-full flex items-center gap-2">
          <input
            type="url"
            v-model="videoUrl"
            placeholder="Вставьте ссылку на видео..."
            class="w-full placeholder-gray-600 text-gray-600 py-3 px-4 bg-gray-300/40 ring-1 ring-gray-300/40 font-medium rounded-lg shadow-sm outline-none focus:outline-none focus:ring-1 focus:ring-white h-full"
          />
          <button
            @click="handleVideoUrlInsert"
            class="h-full flex items-center justify-center bg-gray-300/40 hover:bg-gray-100 text-gray-700 hover:text-gray-400 font-medium py-3 px-4 rounded-lg shadow-sm transition duration-150 ease-in-out"
          >
            <span class="text-sm whitespace-nowrap">Вставить</span>
          </button>
        </div>
      </div>
      <div
        v-else
        class="bg-gray-300/30 dark:text-slate-300 text-gray-600 font-medium py-2 px-4 rounded-lg shadow-sm flex flex-row gap-2 items-center justify-center w-full h-full"
      >
        <div class="w-3/4 h-2 bg-gray-400 rounded-full">
          <div
            class="h-full bg-white dark:bg-[#152234] rounded-full"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
        <span class="text-black/70 dark:text-white"
          >{{ uploadProgress.toFixed(1) }}%</span
        >
      </div>
    </div>

    <div v-else class="relative group">
      <div
        class="outline-none gap-2 flex flex-col"
        :tabindex="0"
        autofocus
        @keydown.prevent.space="playing = !playing"
        @keydown.right="currentTime += 10"
        @keydown.left="currentTime -= 10"
      >
        <div class="relative bg-black rounded-md shadow overflow-hidden group">
          <div
            class="absolute z-[1] h-fit py-2 flex justify-end items-center px-4 w-full bg-black/60 transition-all duration-300 transform -translate-y-full group-hover:translate-y-0"
          >
            <button
              @click="addPoster"
              class="bg-gray-800/90 border border-white text-white font-medium text-xs rounded-full px-2 py-1"
            >
              Добавить постер
            </button>
          </div>
          <video
            ref="video"
            crossorigin="anonymous"
            class="w-full block"
            :poster="poster"
            :loop="loop"
            @click="playing = !playing"
          />

          <div
            v-if="waiting"
            class="absolute inset-0 grid place-items-center pointer-events-none bg-black bg-opacity-20"
          >
            <Spinner />
          </div>
        </div>

        <Scrubber v-model="currentTime" :max="duration" :secondary="endBuffer">
          <template #default="{ position, pendingValue }">
            <div
              class="absolute transform -translate-x-1/2 bg-black rounded px-2 bottom-0 mb-4 py-1 text-xs text-white"
              :style="{ left: position }"
            >
              {{ formatDuration(pendingValue) }}
            </div>
          </template>
        </Scrubber>

        <div class="flex flex-row items-center">
          <button @click="playing = !playing">
            <Play v-if="!playing" />
            <Pause v-else />
          </button>
          <button @click="muted = !muted">
            <VolumeMute v-if="muted" />
            <VolumeUp v-else />
          </button>
          <Scrubber v-model="volume" :max="1" class="w-32 ml-2" />
          <div class="flex flex-row items-center flex-1 text-sm ml-2">
            {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
          </div>

          <div class="flex flex-row items-center gap-2">
            <Menu>
              <template #default="{ open }">
                <button @click="open">
                  <ClosedCaption class="align-middle inline-block" />
                </button>
              </template>
              <template #menu="{ close }">
                <div
                  class="absolute bottom-0 right-0 bg-black rounded py-2 shadow"
                >
                  <MenuItem
                    @keydown.stop.prevent.enter.space="disableTrack()"
                    @click="
                      () => {
                        disableTrack();
                        close();
                      }
                    "
                  >
                    <span class="flex-1">Off</span>
                    <Checkmark
                      class="align-middle inline-block"
                      :class="{ 'opacity-0': selectedTrack !== -1 }"
                    />
                  </MenuItem>
                  <MenuItem
                    v-for="track in tracks"
                    :key="track.id"
                    @keydown.stop.prevent.enter.space="enableTrack(track)"
                    @click="
                      () => {
                        enableTrack(track);
                        close();
                      }
                    "
                  >
                    <span class="flex-1">{{ track.label }}</span>
                    <Checkmark
                      class="align-middle inline-block"
                      :class="{ 'opacity-0': track.mode !== 'showing' }"
                    />
                  </MenuItem>
                </div>
              </template>
            </Menu>
            <Menu>
              <template #default="{ open }">
                <button class="block" @click="open()">
                  <Settings class="align-middle inline-block" />
                </button>
              </template>
              <template #menu="{ close }">
                <div
                  class="absolute bottom-0 right-0 shadow py-2 bg-black rounded"
                >
                  <MenuItem
                    v-if="supportsPictureInPicture"
                    @click="
                      () => {
                        togglePictureInPicture();
                        close();
                      }
                    "
                  >
                    <Popup class="align-middle inline-block" />
                    <span
                      >{{ isPictureInPicture ? 'Exit' : 'Enter' }} Picture in
                      Picture</span
                    >
                  </MenuItem>
                  <MenuItem
                    @click="
                      () => {
                        loop = !loop;
                        close();
                      }
                    "
                  >
                    <Repeat class="align-middle inline-block" />
                    <span class="flex-1">Loop</span>
                    <Checkmark class="align-middle inline-block" v-if="loop" />
                  </MenuItem>
                </div>
              </template>
            </Menu>
            <Menu>
              <template #default="{ open }">
                <button class="block" @click="open()">
                  <Meter />
                </button>
              </template>
              <template #menu="{ close }">
                <div
                  class="absolute bottom-0 right-0 shadow py-2 bg-black text-white rounded"
                >
                  <MenuItem
                    @click="
                      () => {
                        controls.rate.value = 2;
                        close();
                      }
                    "
                  >
                    <MeterAlt />2x
                  </MenuItem>
                  <MenuItem
                    @click="
                      () => {
                        controls.rate.value = 1;
                        close();
                      }
                    "
                  >
                    <MeterAlt />1x
                  </MenuItem>
                </div>
              </template>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3';
import { Editor } from '@tiptap/core';
import { onMounted, watch } from 'vue';
import ImagePlus from '@/assets/svg/editor/ImagePlus.vue';
import { useDocumentContentStore } from '@/stores/documentContent';
import VideoUpload from '@/assets/svg/editor/VideoUpload.vue';
import { useMediaControls } from '@vueuse/core';
import { computed, ref } from 'vue';
import MenuItem from '../Video/MenuItem.vue';
import Scrubber from '../Video/Scrubber.vue';
import Spinner from '../Video/Spinner.vue';
import Menu from '../Video/Menu.vue';
import Play from '@/assets/svg/editor/VideoPlayer/Play.vue';
import Pause from '@/assets/svg/editor/VideoPlayer/Pause.vue';
import VolumeUp from '@/assets/svg/editor/VideoPlayer/VolumeUp.vue';
import VolumeMute from '@/assets/svg/editor/VideoPlayer/VolumeMute.vue';
import ClosedCaption from '@/assets/svg/editor/VideoPlayer/ClosedCaption.vue';
import Checkmark from '@/assets/svg/editor/VideoPlayer/Checkmark.vue';
import Settings from '@/assets/svg/editor/VideoPlayer/Settings.vue';
import Popup from '@/assets/svg/editor/VideoPlayer/Popup.vue';
import Repeat from '@/assets/svg/editor/VideoPlayer/Repeat.vue';
import Meter from '@/assets/svg/editor/VideoPlayer/Meter.vue';
import MeterAlt from '@/assets/svg/editor/VideoPlayer/MeterAlt.vue';
import ArrowRight from '@/assets/svg/editor/ArrowRight.vue';

const { t, locale } = useI18n();
const route = useRoute();
const documentId = ref(route.query.id);

const documentContentStore = useDocumentContentStore();

const props = defineProps<{
  node: {
    attrs: {
      poster: string;
      src: string;
      documentId: string | undefined;
      type: string;
    };
  };
  updateAttributes: (
    attrs: Partial<{
      poster: string;
      src: string;
      documentId: string | undefined;
      type: string;
    }>
  ) => void;
  editor: Editor;
}>();

const notifyStore = useNotifyStore();
const fileInput = ref<HTMLInputElement | null>(null);
const src = ref<string>(props.node.attrs.src);
const type = ref<string>(props.node.attrs.type);
const videoUrl = ref<string>(
  'https://asrp.media/storage/documents/a69e496a-6d5f-4a6f-a2c3-ef037f5337d3/gritsenko-banchenko.mp4'
);

const uploading = ref(false);
const uploadProgress = ref(0);

const video = ref<HTMLVideoElement>();
const loop = ref(false);
const poster = ref<string>(props.node.attrs.type);

const mediaSource = computed(() => {
  return {
    src: src.value,
    type: type.value,
  };
});

const controls = useMediaControls(video, {
  src: mediaSource,
});

const {
  playing,
  buffered,
  currentTime,
  duration,
  tracks,
  waiting,
  selectedTrack,
  volume,
  muted,
  isPictureInPicture,
  supportsPictureInPicture,
  togglePictureInPicture,
  enableTrack,
  disableTrack,
} = controls;

const endBuffer = computed(() =>
  buffered.value.length > 0 ? buffered.value[buffered.value.length - 1][1] : 0
);

function formatDuration(seconds: number) {
  return new Date(1000 * seconds).toISOString().slice(14, 19);
}

const triggerFileInput = () => {
  fileInput.value?.click();
};

const addPoster = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 999 * 1024) {
        await notifyStore.notifyError('Размер файла превышает 999 кБ');
        event.preventDefault();
        return;
      }

      if (!documentId.value) {
        await notifyStore.notifyError(
          'Документ не найден. Сохраните документ и попробуйте снова'
        );
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
          poster: fullPath,
        });
        await notifyStore.notifySuccess('Постер загружен');
      } catch (error) {
        await notifyStore.notifyError('Ошибка при загрузке постера');
        console.error(error);
      }
    }
  };
  fileInput.click();
};
const handleVideoUrlInsert = async () => {
  if (videoUrl.value) {
    props.updateAttributes({
      src: videoUrl.value,
      type: 'video/mp4',
    });
    await notifyStore.notifySuccess('Видео загружено');
  } else {
    await notifyStore.notifyError('Пожалуйста, вставьте правильную ссылку');
  }
};
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!documentId.value) {
    await notifyStore.notifyError(
      'Документ не найден. Сохраните документ и попробуйте снова'
    );
    console.error('Document ID is required');
    return;
  }
  if (file) {
    if (file.size > 999 * 1024 * 1024 * 1024) {
      await notifyStore.notifyError('Размер файла превышает 2 ГБ');
      event.preventDefault();
      return;
    }
    uploading.value = true;
    try {
      const response = await documentContentStore.uploadFile(
        file,
        documentId.value as string,
        (progress: number) => {
          uploadProgress.value = progress;
        }
      );

      const fullPath = `https://asrp.media/storage/${response.path}`;

      props.updateAttributes({
        src: fullPath,
        type: response.mimetype,
      });

      await notifyStore.notifySuccess('Видео загружено');
    } catch (error) {
      await notifyStore.notifyError('Ошибка при загрузке видео');
      console.error(error);
    } finally {
      uploading.value = false;
      target.value = '';
    }
  }
};

const removeVideo = () => {
  props.updateAttributes({
    src: null,
  });
};

watch(
  () => props.node.attrs.src,
  (newSrc) => {
    src.value = newSrc;
  }
);

watch(
  () => props.node.attrs.type,
  (newType) => {
    type.value = newType;
  }
);

watch(
  () => props.node.attrs.poster,
  (newType) => {
    poster.value = newType;
  }
);

watch(
  () => videoUrl.value,
  (newValue) => {
    if (newValue) {
      src.value = newValue;
    }
  }
);

watch(
  () => props.node.attrs,
  (newAttrs) => {
    console.log('Node attributes updated:', newAttrs); // Логируем обновленные атрибуты
  },
  { deep: true }
);

onMounted(() => {
  props.editor.commands.blur();
});
</script>
