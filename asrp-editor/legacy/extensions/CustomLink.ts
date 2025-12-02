import Link from '@tiptap/extension-link';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const CustomLink = Link.extend({
  inclusive: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a',
        getAttrs: (node) => ({
          href: node.getAttribute('href'),
          target: node.getAttribute('target'),
          rel: node.getAttribute('rel'),
          class: node.getAttribute('class') || 'link',
          title: node.getAttribute('title'),
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['a', HTMLAttributes, 0];
  },
});

export default CustomLink;
