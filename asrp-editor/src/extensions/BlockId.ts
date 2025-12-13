import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { v4 as uuid } from 'uuid';

export interface BlockIdOptions {
  types: string[];
}

/**
 * BlockId Extension
 * Добавляет уникальный blockId к каждому блоку в документе
 * Это позволяет AI работать с конкретными блоками
 */
export const BlockId = Extension.create<BlockIdOptions>({
  name: 'blockId',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'listItem'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) => {
              if (!attributes.blockId) {
                return {};
              }
              return {
                'data-block-id': attributes.blockId,
              };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockId'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged = transactions.some((transaction) => transaction.docChanged);
          if (!docChanged) {
            return;
          }

          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            // Проверяем, нужен ли этому типу узла blockId
            if (!this.options.types.includes(node.type.name)) {
              return;
            }

            // Если у узла уже есть blockId, пропускаем
            if (node.attrs.blockId) {
              return;
            }

            // Добавляем blockId
            const blockId = `block_${uuid().substring(0, 8)}`;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              blockId,
            });
            modified = true;
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});

export default BlockId;

