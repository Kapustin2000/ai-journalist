import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import AdvertisingBlock from '~/components/Editor/Content/NodeView/AdvertisingBlock.vue';

export const SalesNode = Node.create({
  name: 'sales',

  group: 'block',
  inline: false,
  atom: true,
  defining: true,
  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'advertising-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['advertising-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return VueNodeViewRenderer(AdvertisingBlock as any);
  },
});
