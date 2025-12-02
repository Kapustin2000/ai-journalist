<template>
  <div class="flex flex-col gap-y-3 px-2">
    <span>
      {{ t('editor.history.title') }}
    </span>
    <div v-if="versionHistory.length > 0" class="">
      <Accordion
        type="single"
        collapsible
        class="custom-scroll max-h-[250px] overflow-y-auto overflow-x-hidden flex flex-col gap-y-1.5"
      >
        <template v-for="(item, index) in versionHistory" :key="item.id">
          <AccordionItem :value="item.id">
            <AccordionTrigger class="cursor-pointer">
              <span>{{ refactorDate(item.createdAt) }}</span>
              <Badge
                v-if="currentVersionIndex === index"
                class="border border-green-800"
                variant="outline"
              >
                {{ t('editor.history.current') }}
              </Badge>
            </AccordionTrigger>
            <AccordionContent class="px-2">
              <div class="py-1.5">
                <span>{{ t('editor.history.changesFrom') }}: </span>
                <span v-if="item.Author">
                  {{ item.Author.firstName }} {{ item.Author.lastName }}
                </span>
                <span v-else>-</span>
              </div>
              <div
                v-if="currentVersionIndex !== index && editor.isEditable"
                class="w-full"
              >
                <button
                  @click="restoreVersion(index)"
                  class="bg-primary-foreground hover:bg-primary-foreground/50 border border-primary-foreground rounded-md px-2 py-1 cursor-pointer transition duration-150"
                >
                  {{ t('editor.history.restore') }}
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </template>
        <!-- <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem> -->
      </Accordion>
    </div>

    <div v-else class="flex flex-col px-5 py-2 justify-center items-center">
      <p class="text-md">
        {{ t('editor.history.empty') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import type { FSDocument } from '~/types/FSDocument';

const { t, locale } = useI18n();

const props = defineProps({
  document: {
    type: Object as () => FSDocument,
    required: true,
  },
  editor: {
    type: Object as () => Editor,
    required: true,
  },
});
const document = computed(() => props.document);
const editor = computed(() => props.editor);

const versionHistory = computed(() => {
  return [...document.value.DocumentDraftContents].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const currentVersionIndex = ref(0);

const refactorDate = computed(() => {
  return (date: Date) => {
    const newDate = new Date(date);
    return newDate.toLocaleString(locale.value, {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
});

const restoreVersion = (index: number) => {
  const draft = versionHistory.value[index];
  const originalIndex = document.value.DocumentDraftContents.findIndex(
    (d) => d.id === draft.id
  );

  if (originalIndex !== -1) {
    currentVersionIndex.value = index;
    props.editor.commands.setContent(draft.content);
  }
};
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 10px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background-color: oklch(0.922 0 0);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 50px;
}
</style>
