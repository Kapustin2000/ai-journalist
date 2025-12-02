export const DEFAULT_EDITOR_DOC = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: {
        level: 1,
      },
      content: [
        {
          type: 'text',
          text: 'Новый документ',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Начните писать текст — изменения сохраняйте кнопкой «Сохранить».',
        },
      ],
    },
  ],
};

export const buildDefaultBlocks = () => [
  {
    type: 'tiptap',
    data: DEFAULT_EDITOR_DOC,
  },
];

