import { createI18n } from 'vue-i18n';

const messages = {
  ru: {
    editor: {
      start: 'Начните редактирование…',
      meta: {
        article_title: {
          title: 'Заголовок статьи',
        },
        brief_desc: {
          title: 'Краткое описание',
          placeholder: 'О чём этот материал?',
        },
        seo_title: {
          title: 'SEO заголовок',
          placeholder: 'Заголовок для поисковиков',
        },
        seo_desc: {
          title: 'SEO описание',
          placeholder: 'Описание для поисковиков',
        },
      },
      toolbar: {
        content: {
          paragraph: { title: 'Обычный текст' },
          heading_1: { title: 'Заголовок 1' },
          heading_2: { title: 'Заголовок 2' },
          heading_3: { title: 'Заголовок 3' },
          bulletList: { title: 'Маркированный список' },
          orderedList: { title: 'Нумерованный список' },
          blockquote: { title: 'Цитата' },
          image: { title: 'Изображение' },
          video: { title: 'Видео' },
        },
      },
    },
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages,
});

