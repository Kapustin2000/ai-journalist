<template>
  <node-view-wrapper class="max-w-full w-full my-6">
    <div v-if="!carouselItems.length">
      <div
        class="bg-gray-300/30 dark:text-slate-300 text-gray-600 font-medium py-2 px-4 rounded-lg shadow-sm flex flex-col gap-2 items-center justify-center w-full h-full"
      >
        К документу не прикреплены акции!
      </div>
    </div>

    <div v-else class="relative group">
      <h3 class="scroll-m-20 mb-[20px] text-2xl tracking-tight text-pretty">
        Эксклюзивные акции для наших читателей
      </h3>
      <Carousel
        class="relative w-full select-none"
        :opts="{
          align: 'start',
        }"
        ref="carouselRef"
      >
        <CarouselContent>
          <CarouselItem
            v-for="(item, index) in [...Array(5)].flatMap(() => carouselItems)"
            :key="index"
            class="snap-start w-full basis-full lg:basis-1/2"
          >
            <Card class="rounded-lg overflow-hidden h-full">
              <CardContent
                class="flex flex-col h-max items-start rounded-xl py-4 overflow-x-auto scroll-smooth scrollbar-hide"
              >
                <NuxtLink
                  :to="item.url || '#'"
                  class="w-full h-fit"
                  target="_blank"
                >
                  <div
                    class="relative w-full h-[18.75rem] rounded-[1.25rem] overflow-hidden bg-white dark:bg-gray-800 mb-3"
                    style="--clr: #fff"
                  >
                    <div
                      class="w-full h-full rounded-[1.25rem] overflow-hidden bg-slate-500"
                    >
                      <div class="imgBox">
                        <NuxtImg
                          v-if="item.image"
                          :src="item.image"
                          :class="'h-full object-contain aspect-video'"
                          loading="lazy"
                          :placeholder="[50, 25, 75, 5]"
                          width="600"
                          height="750"
                          alt="Banner Image"
                        />
                      </div>
                    </div>
                  </div>
                </NuxtLink>

                <h3
                  v-if="
                    item.title.find((item) => item.language === locale)?.content
                  "
                  class="scroll-m-20 text-2xl tracking-tight text-pretty !mt-0 !mb-0"
                >
                  {{
                    item.title.find((item) => item.language === locale)?.content
                  }}
                </h3>

                <p class="text-sm dark:text-gray-400 mt-1 mb-2 line-clamp-2">
                  {{
                    item.description.find((item) => item.language === locale)
                      ?.content
                  }}
                </p>

                <a
                  v-if="item.url"
                  :href="item.url"
                  class="text-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-normal text-sm text-center dark:focus:ring-blue-800 mt-auto"
                >
                  {{ t('learnMore') }}
                </a>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious class="-left-7" />
        <CarouselNext class="-right-7" />
      </Carousel>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3';
import { Editor } from '@tiptap/core';
import { onMounted, watch } from 'vue';
import { computed, ref } from 'vue';
import type { Banner, FSBanner } from '~/types/banner';

const { t, locale } = useI18n();
const route = useRoute();

const props = defineProps<{
  node: {
    attrs: Record<string, any>; // если нужны другие атрибуты
  };
  updateAttributes: (attrs: Partial<Record<string, any>>) => void;
  editor: Editor;
}>();
const store = useDocumentStore();

const { document } = storeToRefs(store);

interface CarouselItem extends FSBanner {
  image: string | null;
}

const banners = computed(() => {
  return document.value?.Sales?.[0]?.Banners ?? [];
});

const carouselItems = computed<CarouselItem[]>(() => {
  return banners.value.map((banner) => {
    const imageWeb = Array.isArray(banner.imageWeb) ? banner.imageWeb : [];

    const originalImage = imageWeb.find((image) => image.isOriginal);

    const imagePath = originalImage
      ? `https://asrp.media/storage${originalImage.path}`
      : imageWeb.length > 0
      ? `https://asrp.media/storage${imageWeb[0].path}`
      : null;

    return {
      ...banner,
      image: imagePath,
    };
  });
});

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
