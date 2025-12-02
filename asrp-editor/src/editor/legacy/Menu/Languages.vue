<template>
  <Accordion type="single" collapsible class="px-2 select-none">
    <AccordionItem value="translate-language" class="flex flex-col gap-3">
      <AccordionTrigger class="w-full cursor-pointer">
        <span>Translate:</span>
      </AccordionTrigger>
      <AccordionContent class="flex flex-col gap-1.5">
        <template v-for="language in languages" :key="language.code">
          <ContextMenu>
            <ContextMenuTrigger
              class="flex bg-secondary cursor-pointer items-center justify-between rounded-md border border-dashed p-2 hover:bg-primary-foreground/50 transition duration-150"
              :class="{
                'border border-green-800 ':
                  isCompletedLanguage(language) ||
                  hasApprovedContent(language.code),
                'border border-destructive ': !isCompletedLanguage(language),
              }"
              @click="props.setLocale(language.code)"
            >
              <div class="flex items-center gap-1.5">
                <CircleCheck
                  v-if="
                    isCompletedLanguage(language) ||
                    hasApprovedContent(language.code)
                  "
                  class="w-4 h-4 text-green-800"
                />
                <CircleAlert v-else class="w-4 h-4 text-destructive" />
                <span>{{ language.name }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm text-muted-foreground">{{
                  language.code
                }}</span>
                <span class="text-sm text-muted-foreground">⌘ RMB</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent class="w-64">
              <ContextMenuItem
                inset
                @click="approveContent(language)"
                :disabled="!hasDraftContent(language.code)"
              >
                {{ isApproving ? 'Approving...' : 'Approve content' }}
                <ContextMenuShortcut>⌘[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                inset
                @click="rejectContent(language)"
                :disabled="!hasApprovedContent(language.code)"
              >
                Reject content
                <ContextMenuShortcut>⌘]</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </template>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>

<script setup lang="ts">
import type { FSDocument } from '~/types/FSDocument';
import languageLib from '~/lib/language';
import type { Language } from '~/types/language';
import { CircleAlert, CircleCheck } from 'lucide-vue-next';
import type { MultiLanguage } from '~/types/MultiLanguage';
import { toast } from 'vue-sonner';

const props = defineProps({
  document: {
    type: Object as () => FSDocument,
    required: true,
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
const selectedLanguage = computed(() => props.selectedLanguage);

const languages = ref<Language[]>(await languageLib.sync());
const document = computed(() => props.document);
const documentContentStore = useDocumentContentStore();
const isApproving = ref<boolean>(false);
const isRejecting = ref<boolean>(false);

const completedLanguages = computed(() => {
  const languages =
    document.value?.DocumentDraftContents.map(
      (content) => content.Language?.code
    ).filter((code) => code) || [];

  const uniqueLanguages = [...new Set(languages)];

  return uniqueLanguages;
});

const isCompletedLanguage = (language: Language) => {
  return completedLanguages.value.some((code) => code === language.code);
};

// Получаем список утвержденных языков
const approvedLanguages = computed(() => {
  return (
    props.document?.DocumentContents?.map(
      (content) => content.Language?.code
    ) || []
  );
});

// Получаем последний черновик для каждого языка
const latestDrafts = computed(() => {
  const draftsByLanguage: Record<string, any> = {};

  props.document?.DocumentDraftContents?.forEach((draft) => {
    const langCode = draft.Language?.code;
    if (!langCode) return;

    if (
      !draftsByLanguage[langCode] ||
      new Date(draft.createdAt) > new Date(draftsByLanguage[langCode].createdAt)
    ) {
      draftsByLanguage[langCode] = draft;
    }
  });

  return draftsByLanguage;
});

// Проверяем, утвержден ли уже контент для этого языка
const isContentApproved = (languageCode: string) => {
  return approvedLanguages.value.includes(languageCode);
};

// Проверяем, есть ли черновик для этого языка
const hasDraftContent = (languageCode: string) => {
  return !!latestDrafts.value[languageCode];
};

const hasApprovedContent = (languageCode: string) => {
  return !!document.value?.DocumentContents.find(
    (content) => content.Language?.code === languageCode
  );
};

// Получаем последний черновик для языка
const getLatestDraft = async (languageCode: string) => {
  return latestDrafts.value[languageCode];
};
const getLatestContent = async (languageCode: string) => {
  return document.value?.DocumentContents.find(
    (content) => content.Language?.code === languageCode
  );
};

const approveContent = async (language: Language) => {
  isApproving.value = true;

  toast.info('Approving content...', {
    action: {
      label: 'Close',
    },
  });

  const latestDraft = await getLatestDraft(language.code);
  if (!latestDraft) {
    isApproving.value = false;

    return toast.error('No draft found!', {
      action: {
        label: 'Close',
      },
    });
  }

  try {
    await documentContentStore.approveContent({
      documentId: props.document.id,
      languageId: language.id,
      content: latestDraft.content,
    });

    toast.success('Content approved!', {
      action: {
        label: 'Close',
      },
    });
  } catch (error) {
    console.error('Error during approve content:', error);
    toast.error('Error during approve content!', {
      action: {
        label: 'Close',
      },
    });
  } finally {
    isApproving.value = false;
  }
};

const rejectContent = async (language: Language) => {
  isRejecting.value = true;

  toast.info('Rejecting content...', {
    action: {
      label: 'Close',
    },
  });

  const latestContent = await getLatestContent(language.code);
  if (!latestContent) {
    isRejecting.value = false;

    return toast.error('No content found!', {
      action: {
        label: 'Close',
      },
    });
  }

  try {
    await documentContentStore.rejectContent({
      id: latestContent.id,
    });

    toast.success('Content rejected!', {
      action: {
        label: 'Close',
      },
    });
  } catch (error) {
    console.error('Error during reject content:', error);
    toast.error('Error during reject content!', {
      action: {
        label: 'Close',
      },
    });
  } finally {
    isRejecting.value = false;
  }
};
</script>

<style scoped></style>
