import type { Editor } from '@tiptap/vue-3';
import type { Range } from '@tiptap/core';

export interface SuggestionItem {
  name: string;
  description: string;
  icon?: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

