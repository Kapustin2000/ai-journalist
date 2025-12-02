<template>
  <bubble-menu
    :editor="editor"
    :plugin-key="pluginKey"
    :tippy-options="{
      duration: 100,
      interactive: true,
      zIndex: 11,
    }"
    :key="pluginKey"
    :should-show="shouldShow"
    class="w-max flex bg-primary-foreground border border-border rounded-md shadow-md p-2 mb-2"
  >
    <!-- <div class="flex items-center relative">
      <button
        @click="toggleAIContentTypeMenu"
        :class="{ 'bg-gray-100/80 ': showAIContentTypeMenu }"
        class="flex items-center text-sm px-2.5 py-1.5 rounded hover:bg-gray-100/80 dark:hover:text-[#152234]"
      >
        <div class="flex items-center">
          <Sparkles class="w-3.5 h-3.5 me-1" />
          <span>AI Tools</span>
        </div>
        <ChevronDown class="w-3.5 h-3.5 ms-1" />
      </button>
      <div
        v-if="showAIContentTypeMenu"
        class="w-max absolute top-10 start-0 bg-white dark:border dark:border-white dark:bg-gray-400 rounded-md shadow-md z-10 p-1.5 min-w-[140px]"
      >
        <button
          v-for="type in aiContentTypes"
          :key="type.name"
          @click="setAIContentType(type.command)"
          :class="{
            'bg-gray-100/80 rounded ': editor.isActive(
              type.name,
              type.attrs
            ),
          }"
          class="flex items-center justify-center w-full text-start px-3 py-2 hover:bg-gray-100/80 dark:hover:text-[#152234] rounded"
        >
          <div
            class="border border-border rounded-full p-1 grid place-items-center"
          >
            <component :is="type.icon" class="w-3 h-3" />
          </div>
          <span class="flex-grow text-sm ms-2">{{ type.label }}</span>
        </button>
      </div>
    </div>
    <div class="w-px my-auto h-8 bg-gray-200/70 mx-1"></div> -->
    <div class="flex items-center relative">
      <button
        @click="toggleContentTypeMenu"
        :class="{
          'bg-secondary': showContentTypeMenu,
        }"
        class="flex items-center text-sm px-2.5 py-1.5 rounded hover:bg-secondary transition duration-150 cursor-pointer"
      >
        {{ currentContentType }}
        <ChevronDown class="w-3.5 h-3.5 ms-1" />
      </button>
      <div
        v-if="showContentTypeMenu"
        class="w-max absolute top-10 start-0 bg-primary-foreground border border-border rounded-md shadow-md z-10 p-1.5 min-w-[140px]"
      >
        <button
          v-for="type in contentTypes"
          :key="type.name"
          @click="setContentType(type.command)"
          :class="{
            'bg-secondary rounded ': editor.isActive(type.name, type.attrs),
          }"
          class="flex items-center justify-center w-full text-start px-3 py-2 hover:bg-secondary transition duration-150 rounded cursor-pointer"
        >
          <div
            class="border border-border rounded-full p-1 grid place-items-center"
          >
            <component :is="type.icon" class="w-3 h-3" />
          </div>
          <span class="flex-grow text-sm ms-2">{{ type.label }}</span>
        </button>
      </div>
    </div>

    <div class="w-px my-auto h-8 bg-border mx-1"></div>
    <div class="flex items-center space-x-2">
      <button
        v-for="action in textActions"
        :key="action.name"
        @click="action.command()"
        :class="{
          'bg-secondary': editor.isActive(action.name),
        }"
        :title="action.label"
        class="rounded hover:bg-secondary transition duration-150 w-8 h-8 grid place-items-center"
      >
        <component :is="action.icon" class="h-5 w-5" />
      </button>
    </div>

    <div class="flex items-center relative">
      <button
        @click="toggleSetLinkMenu"
        :title="t('editor.toolbar.link.title')"
        :class="{
          'bg-secondary': showSetLinkMenu,
        }"
        class="rounded hover:bg-secondary w-8 h-8 grid place-items-center mx-2"
      >
        <Link class="w-5 h-5" />
      </button>

      <div
        v-if="showSetLinkMenu"
        class="min-w-[300px] absolute top-10 flex flex-col gap-y-2.5 left-0 bg-primary-foreground border border-border rounded-md shadow-md z-10 p-1.5"
      >
        <div class="dark:text-gray-200">
          <label for="linkUrl">
            {{ t('editor.toolbar.link.label_url.title') }}
          </label>
          <input
            id="linkUrl"
            v-model="linkUrl"
            type="text"
            :placeholder="t('editor.toolbar.link.label_url.placeholder')"
            class="border border-border outline-none bg-transparent p-1 rounded w-full"
          />
        </div>
        <div class="dark:text-gray-200">
          <label for="linkTitle">
            {{ t('editor.toolbar.link.label_title.title') }}
          </label>
          <input
            id="linkTitle"
            v-model="linkTitle"
            type="text"
            :placeholder="t('editor.toolbar.link.label_title.placeholder')"
            class="border dark:border-gray-400 outline-none bg-transparent p-1 rounded w-full"
          />
        </div>
        <button
          @click="createLink"
          :disabled="!linkUrl"
          class="bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-2 py-1"
        >
          {{ t('editor.toolbar.link.create') }}
        </button>
      </div>
    </div>

    <!-- <div class="flex items-center relative">
      <button
        @click="toggleColorMenu"
        :class="{
          'bg-secondary ': showColorMenu,
        }"
        class="rounded hover:bg-secondary transition duration-150 w-8 h-8 grid place-items-center cursor-pointer"
        :title="t('editor.toolbar.colors.title')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 18 20"
        >
          <path
            fill="currentColor"
            d="M7.82218 0.0290897C7.80563 0.0567699 6.72426 2.96319 5.41118 6.49517C4.09809 10.0272 3.01673 12.9336 3.00018 12.9557C2.98915 12.9834 3.48569 13 4.10361 13H5.22911L5.65945 11.7931C5.89117 11.1344 6.16151 10.387 6.24979 10.1323L6.4153 9.67838L9.04147 9.68946L11.6621 9.70606L12.2138 11.3503L12.76 13H13.88H15L14.5641 11.8208C14.3214 11.1786 13.2345 8.25562 12.1531 5.3326L10.178 0.0180176L9.01388 0.00140935C8.36838 -0.00412667 7.83321 0.00694565 7.82218 0.0290897ZM9.97387 5.03366C10.4704 6.44534 10.8897 7.64666 10.9063 7.69649C10.9339 7.7906 10.818 7.79613 9.00285 7.79613C7.93804 7.79613 7.06633 7.7906 7.06633 7.77953C7.06633 7.76845 8.76009 2.92997 8.91457 2.49262C8.93113 2.44833 8.96975 2.42619 9.00837 2.43726C9.04147 2.44833 9.47732 3.61644 9.97387 5.03366Z"
          />
          <path
            d="M0 18.5V20H9H18V18.5V17H9H0V18.5Z"
            :fill="
              props.editor?.getAttributes('textStyle').color || 'currentColor'
            "
          />
        </svg>
      </button>
      <div
        v-if="showColorMenu"
        class="absolute top-10 left-0 bg-primary-foreground border border-border rounded-md shadow-md z-10 p-1.5"
      >
        <button
          v-for="color in colors"
          :key="color.name"
          @click="setTextColor(color.value)"
          :class="{
            'bg-gray-400': editor.isActive('textStyle', {
              color: color.value,
            }),
          }"
          class="flex items-center w-full text-start px-3 py-2 hover:bg-secondary transition duration-150 rounded cursor-pointer"
        >
          <span
            class="w-4 h-4 rounded-full me-2 border border-border dark:border-gray-600 dark:hover:border-[#152234]"
            :style="{ backgroundColor: color.value }"
          ></span>
          <span class="text-sm font-medium">{{ color.name }}</span>
        </button>
      </div>
    </div> -->
  </bubble-menu>
</template>

<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3';
import { Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import ChevronDown from '~/assets/svg/editor/ChevronDown.vue';
import FormatListBulleted from '~/assets/svg/editor/FormatListBulleted.vue';
import FormatListNumbered from '~/assets/svg/editor/FormatListNumbered.vue';
import FormatHeader1 from '~/assets/svg/editor/FormatHeader1.vue';
import Text from '~/assets/svg/editor/Text.vue';
import FormatHeader2 from '~/assets/svg/editor/FormatHeader2.vue';
import FormatHeader3 from '~/assets/svg/editor/FormatHeader3.vue';
import FormatQuoteClose from '~/assets/svg/editor/FormatQuoteClose.vue';
import type { Component } from 'vue';
import Sparkles from '~/assets/svg/editor/Sparkles.vue';
import Link from '~/assets/svg/editor/Link.vue';
import Grammar from '~/assets/svg/editor/Grammar.vue';
import Longer from '~/assets/svg/editor/Longer.vue';
import Shorter from '~/assets/svg/editor/Shorter.vue';
import Generate from '~/assets/svg/editor/Generate.vue';
import FormatBold from '../Icons/FormatBold.vue';
import FormatItalic from '../Icons/FormatItalic.vue';
import FormatUnderline from '../Icons/FormatUnderline.vue';
import FormatStrike from '../Icons/FormatStrike.vue';
import FormatListBullet from '../Icons/FormatListBullet.vue';
import FormatListNumber from '../Icons/FormatListNumber.vue';
import FormatEraser from '../Icons/FormatEraser.vue';

const { t, locale } = useI18n();

interface ContentType {
  name: string;
  label: string;
  icon: Component;
  command: () => void;
  attrs?: Record<string, unknown>;
}

interface AIContentType {
  name: string;
  label: string;
  icon: Component;
  command: () => void;
  attrs?: Record<string, unknown>;
}

interface TextAction {
  name: string;
  label: string;
  icon: Component;
  command: () => void;
}

interface Color {
  name: string;
  value: string;
}

interface ShouldShowProps {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
}

const props = defineProps<{
  editor: Editor;
  pluginKey?: string;
}>();

const showAIContentTypeMenu = ref(false);
const showContentTypeMenu = ref(false);
const showColorMenu = ref(false);
const showSetLinkMenu = ref(false);

const linkUrl = ref<string | null>(null);
const linkTitle = ref<string | null>(null);

const isTyping = ref(false);
const fullText = ref('');

const shouldShow = ({ editor, from, to }: ShouldShowProps) => {
  return editor.isActive('paragraph') && from !== to;
};

const typeText = async (text: string) => {
  if (!props.editor) {
    return;
  }
  isTyping.value = true;
  fullText.value = text;

  props.editor.commands.clearContent();
  props.editor.setOptions({ editable: false });

  for (let i = 0; i < fullText.value.length; i++) {
    if (props.editor) {
      props.editor.commands.insertContent(fullText.value[i]);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  isTyping.value = false;
  props.editor.setOptions({ editable: true });
};

const generateText = async (type: string) => {
  let newText = '';

  switch (type) {
    case 'grammar':
      newText = 'Исправленный текст с грамматическими ошибками.';
      break;
    case 'longer':
      newText =
        'Трансцендентные состояния мозга и осознанные сновидения представляют собой уникальные аспекты человеческого сознания, которые привлекают внимание ученых и практиков на протяжении многих веков. Трансцендентные состояния, такие как медитация, глубокая релаксация или экстатические переживания, позволяют людям выйти за пределы повседневного восприятия, открывая доступ к глубинным уровням сознания. Эти состояния часто сопровождаются изменениями в активности мозга, включая увеличение альфа- и тета-ритмов, что способствует улучшению креативного мышления, интуиции и углублению самосознания. Исследования показывают, что такие состояния могут привести к глубоким инсайтам и более ясному восприятию внутреннего мира. Например, многие практикующие медитацию сообщают о чувстве внутреннего покоя и связи с чем-то большим, нежели они сами. Эти трансцендентные моменты могут оказывать положительное влияние на психологическое здоровье, снижая уровень стресса и тревожности. Осознанные сновидения, в свою очередь, представляют собой явление, когда человек осознает, что он спит, и может контролировать свои действия во сне. Это состояние открывает уникальные возможности для самопознания, креативности и решения личных проблем. Исследования показывают, что осознанные сновидения могут помочь людям проработать свои страхи, улучшить навыки решения проблем и даже способствовать творческому процессу. Существуют различные методы, которые помогают развить способность к осознанным сновидениям, такие как ведение дневника сновидений и техники проверки реальности. Оба состояния — трансцендентные переживания и осознанные сновидения — открывают новые горизонты для понимания человеческого разума, расширяя границы нашего восприятия реальности и предлагая мощные инструменты для личностного роста и развития.';
      break;
    case 'shorter':
      newText =
        'Трансцендентные состояния мозга и осознанные сновидения представляют собой уникальные аспекты человеческого сознания, которые исследуются на протяжении веков. Трансцендентные состояния, такие как медитация и глубокая релаксация, позволяют человеку выйти за пределы повседневного восприятия и открыть доступ к глубинным уровням сознания. Эти состояния связаны с изменениями в активности мозга, что способствует улучшению креативного мышления и интуиции. Осознанные сновидения — это состояния, когда человек осознает, что он спит, и может контролировать свои действия во сне. Это открывает возможности для самопознания и решения личных проблем. Практики, такие как ведение дневника сновидений, помогают развить эту способность. Оба состояния — трансцендентные переживания и осознанные сновидения — способствуют расширению границ нашего восприятия реальности и улучшают психическое здоровье.';
      break;
    case 'generate':
      newText =
        'Трансцендентные состояния мозга и осознанные сновидения представляют собой уникальные аспекты человеческого сознания. Трансцендентные состояния, такие как медитация или глубокая релаксация, позволяют людям выйти за пределы повседневного восприятия, открывая доступ к глубинным уровням сознания. Эти состояния могут быть связаны с изменениями в активности мозга, включая увеличение альфа- и тета-ритмов, что способствует творческому мышлению и интуиции. Осознанные сновидения, в свою очередь, представляют собой явление, когда человек осознает, что он спит, и может контролировать свои действия во сне. Это состояние предлагает уникальные возможности для самопознания и решения личных проблем. Исследования показывают, что оба состояния могут способствовать улучшению психического здоровья и развитию креативности, расширяя границы нашего восприятия реальности.';
      break;
    case 'summarize':
      newText =
        'Трансцендентные состояния мозга и осознанные сновидения представляют собой две важные области исследования человеческого сознания. Трансцендентные состояния, такие как медитация, помогают углубить самосознание и улучшить креативное мышление, в то время как осознанные сновидения позволяют людям осознавать, что они спят, и контролировать свои сны, что открывает новые возможности для самопознания. Оба этих состояния способствуют улучшению психического здоровья и расширению восприятия реальности, предлагая мощные инструменты для личностного роста и развития.';
      break;
  }

  await typeText(newText); // Вызываем функцию для анимации ввода
};

const aiContentTypes: AIContentType[] = [
  {
    name: 'grammar',
    label: 'Fix Grammar',
    icon: Grammar,
    command: () => generateText('grammar'),
  },
  {
    name: 'longer',
    label: 'Make Longer',
    icon: Longer,
    command: () => generateText('longer'),
  },
  {
    name: 'shorter',
    label: 'Make Shorter',
    icon: Shorter,
    command: () => generateText('shorter'),
  },
  {
    name: 'generate',
    label: 'Generate Content',
    icon: Generate,
    command: () => generateText('generate'),
  },
  {
    name: 'summarize',
    label: 'Summarize',
    icon: Sparkles,
    command: () => generateText('summarize'),
  },
];

const contentTypes: ContentType[] = [
  {
    name: 'paragraph',
    label: t('editor.toolbar.content.paragraph.title'),
    icon: Text,
    command: () => props.editor?.chain().focus().setParagraph().run(),
  },
  {
    name: 'heading',
    label: t('editor.toolbar.content.heading_1.title'),
    icon: FormatHeader1,
    command: () =>
      props.editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    attrs: { level: 1 },
  },
  {
    name: 'heading',
    label: t('editor.toolbar.content.heading_2.title'),
    icon: FormatHeader2,
    command: () =>
      props.editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    attrs: { level: 2 },
  },
  {
    name: 'heading',
    label: t('editor.toolbar.content.heading_3.title'),
    icon: FormatHeader3,
    command: () =>
      props.editor?.chain().focus().toggleHeading({ level: 4 }).run(),
    attrs: { level: 3 },
  },
  {
    name: 'bulletList',
    label: t('editor.toolbar.content.bulletList.title'),
    icon: FormatListBulleted,
    command: () => props.editor?.chain().focus().toggleBulletList().run(),
  },
  {
    name: 'orderedList',
    label: t('editor.toolbar.content.orderedList.title'),
    icon: FormatListNumbered,
    command: () => props.editor?.chain().focus().toggleOrderedList().run(),
  },
  // {
  //   name: 'codeBlock',
  //   label: 'Code Block',
  //   icon: 'mdi:code-tags',
  //   command: () => props.editor?.chain().focus().toggleCodeBlock().run(),
  // },
  {
    name: 'blockquote',
    label: t('editor.toolbar.content.blockquote.title'),
    icon: FormatQuoteClose,
    command: () => props.editor?.chain().focus().toggleBlockquote().run(),
  },
  // {
  //   name: 'textGenerator',
  //   label: 'AI Generate',
  //   icon: Sparkles,
  //   command: () => (showColorMenu.value = true),
  // },
];

const textActions: TextAction[] = [
  {
    name: 'bold',
    label: t('editor.toolbar.actions.bold.title'),
    icon: FormatBold,
    command: () => props.editor?.chain().focus().toggleBold().run(),
  },
  {
    name: 'italic',
    label: t('editor.toolbar.actions.italic.title'),
    icon: FormatItalic,
    command: () => props.editor?.chain().focus().toggleItalic().run(),
  },
  {
    name: 'underline',
    label: t('editor.toolbar.actions.underline.title'),
    icon: FormatUnderline,
    command: () => props.editor?.chain().focus().toggleUnderline().run(),
  },
  {
    name: 'strike',
    label: t('editor.toolbar.actions.strike.title'),
    icon: FormatStrike,
    command: () => props.editor?.chain().focus().toggleStrike().run(),
  },
  {
    name: 'bulletList',
    label: t('editor.toolbar.content.bulletList.title'),
    icon: FormatListBullet,
    command: () => props.editor?.chain().focus().toggleBulletList().run(),
  },
  {
    name: 'orderedList',
    label: t('editor.toolbar.content.orderedList.title'),
    icon: FormatListNumber,
    command: () => props.editor?.chain().focus().toggleOrderedList().run(),
  },
  {
    name: 'clearStyle',
    label: 'Очистить цвет',
    icon: FormatEraser,
    command: () => props.editor?.chain().focus().unsetColor().run(),
  },
];

const createLink = () => {
  if (linkUrl.value) {
    let url = linkUrl.value;

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const title = linkTitle.value || null;

    // Здесь устанавливаем ссылку с атрибутами
    props.editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: 'link',
      })
      .run();

    if (title) {
      props.editor?.chain().focus().updateAttributes('link', { title }).run();
    }

    linkUrl.value = null;
    linkTitle.value = null;
    showSetLinkMenu.value = false;
  } else {
    alert('URL is required.');
  }
};

const colors: Color[] = [
  { name: t('editor.toolbar.colors.default'), value: 'currentColor' },
  { name: t('editor.toolbar.colors.gray'), value: '#6B7280' },
  { name: t('editor.toolbar.colors.brown'), value: '#92400E' },
  { name: t('editor.toolbar.colors.orange'), value: '#EA580C' },
  { name: t('editor.toolbar.colors.yellow'), value: '#CA8A04' },
  { name: t('editor.toolbar.colors.green'), value: '#16A34A' },
  { name: t('editor.toolbar.colors.blue'), value: '#2563EB' },
  { name: t('editor.toolbar.colors.purple'), value: '#9333EA' },
  { name: t('editor.toolbar.colors.pink'), value: '#DB2777' },
  { name: t('editor.toolbar.colors.red'), value: '#DC2626' },
];

const currentContentType = computed(() => {
  if (props.editor?.isActive('heading', { level: 1 }))
    return t('editor.toolbar.content.heading_1.title');
  if (props.editor?.isActive('heading', { level: 2 }))
    return t('editor.toolbar.content.heading_2.title');
  if (props.editor?.isActive('heading', { level: 3 }))
    return t('editor.toolbar.content.heading_3.title');
  if (props.editor?.isActive('bulletList'))
    return t('editor.toolbar.content.bulletList.title');
  if (props.editor?.isActive('orderedList'))
    return t('editor.toolbar.content.orderedList.title');
  if (props.editor?.isActive('blockquote'))
    return t('editor.toolbar.content.blockquote.title');
  return t('editor.toolbar.content.paragraph.title');
});

const toggleContentTypeMenu = () => {
  showContentTypeMenu.value = !showContentTypeMenu.value;
  showColorMenu.value = false;
  showAIContentTypeMenu.value = false;
  showSetLinkMenu.value = false;
};
const toggleSetLinkMenu = () => {
  showSetLinkMenu.value = !showSetLinkMenu.value;
  showColorMenu.value = false;
  showContentTypeMenu.value = false;
  showAIContentTypeMenu.value = false;
};
const toggleAIContentTypeMenu = () => {
  showAIContentTypeMenu.value = !showAIContentTypeMenu.value;
  showColorMenu.value = false;
  showSetLinkMenu.value = false;
  showContentTypeMenu.value = false;
};
const toggleColorMenu = () => {
  showColorMenu.value = !showColorMenu.value;
  showContentTypeMenu.value = false;
  showSetLinkMenu.value = false;
  showAIContentTypeMenu.value = false;
};

const setAIContentType = (command: () => void) => {
  command();
  showAIContentTypeMenu.value = false;
};

const setLink = (command: () => void) => {
  command();
  showSetLinkMenu.value = false;
};

const setContentType = (command: () => void) => {
  command();
  showContentTypeMenu.value = false;
};

const setTextColor = (color: string) => {
  props.editor?.chain().focus().setColor(color).run();
  showColorMenu.value = false;
};
</script>
