import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { MarkdownSerializer, MarkdownSerializerState } from 'prosemirror-markdown';
import { MarkdownParser } from 'prosemirror-markdown';
import { schema } from '@tiptap/pm/schema-basic';

/**
 * Markdown Utilities
 * Конвертация между ProseMirror Document и Markdown с сохранением blockId
 */

/**
 * Сериализует ProseMirror документ в Markdown с HTML комментариями для blockId
 */
export function serializeToMarkdown(doc: ProseMirrorNode): string {
  const serializer = new MarkdownSerializer(
    {
      // Nodes
      paragraph(state: MarkdownSerializerState, node: ProseMirrorNode) {
        // Добавляем HTML комментарий с blockId перед параграфом
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        state.renderInline(node);
        state.closeBlock(node);
      },
      heading(state: MarkdownSerializerState, node: ProseMirrorNode) {
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        state.write(state.repeat('#', node.attrs.level) + ' ');
        state.renderInline(node);
        state.closeBlock(node);
      },
      blockquote(state: MarkdownSerializerState, node: ProseMirrorNode) {
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        state.wrapBlock('> ', null, node, () => state.renderContent(node));
      },
      code_block(state: MarkdownSerializerState, node: ProseMirrorNode) {
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        const lang = node.attrs.language || '';
        state.write('```' + lang + '\n');
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write('```');
        state.closeBlock(node);
      },
      horizontal_rule(state: MarkdownSerializerState, node: ProseMirrorNode) {
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        state.write(node.attrs.markup || '---');
        state.closeBlock(node);
      },
      bullet_list(state: MarkdownSerializerState, node: ProseMirrorNode) {
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        state.renderList(node, '  ', () => '* ');
      },
      ordered_list(state: MarkdownSerializerState, node: ProseMirrorNode) {
        if (node.attrs.blockId) {
          state.write(`<!-- block_id:${node.attrs.blockId} -->\n`);
        }
        const start = node.attrs.order || 1;
        const maxW = String(start + node.childCount - 1).length;
        const space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i: number) => {
          const nStr = String(start + i);
          return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
        });
      },
      list_item(state: MarkdownSerializerState, node: ProseMirrorNode) {
        state.renderContent(node);
      },
      hard_break(state: MarkdownSerializerState) {
        state.write('\\\n');
      },
      image(state: MarkdownSerializerState, node: ProseMirrorNode) {
        state.write(
          '![' +
            state.esc(node.attrs.alt || '') +
            '](' +
            state.esc(node.attrs.src) +
            (node.attrs.title ? ' "' + state.esc(node.attrs.title) + '"' : '') +
            ')'
        );
      },
      text(state: MarkdownSerializerState, node: ProseMirrorNode) {
        state.text(node.text || '');
      },
    },
    {
      // Marks
      em: { open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true },
      strong: { open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true },
      code: { open: '`', close: '`', escape: false },
      link: {
        open(_state: MarkdownSerializerState, mark: any) {
          return '[';
        },
        close(state: MarkdownSerializerState, mark: any) {
          return '](' + state.esc(mark.attrs.href) + (mark.attrs.title ? ' "' + state.esc(mark.attrs.title) + '"' : '') + ')';
        },
      },
      underline: { open: '<u>', close: '</u>', mixable: true },
    }
  );

  return serializer.serialize(doc);
}

/**
 * Парсит Markdown в ProseMirror документ, извлекая blockId из комментариев
 */
export function parseFromMarkdown(markdown: string): any {
  // Создаем простой парсер который обрабатывает блоки с комментариями
  const lines = markdown.split('\n');
  const blocks: any[] = [];
  let currentBlockId: string | null = null;
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Проверяем на HTML комментарий с blockId
    const blockIdMatch = line.match(/<!--\s*block_id:([a-z0-9_]+)\s*-->/);
    if (blockIdMatch) {
      // Сохраняем предыдущий блок если есть
      if (currentContent.length > 0) {
        blocks.push({
          blockId: currentBlockId,
          content: currentContent.join('\n'),
        });
        currentContent = [];
      }
      currentBlockId = blockIdMatch[1];
      continue;
    }

    // Пустая строка - конец блока
    if (line.trim() === '' && currentContent.length > 0) {
      blocks.push({
        blockId: currentBlockId,
        content: currentContent.join('\n'),
      });
      currentContent = [];
      currentBlockId = null;
      continue;
    }

    // Добавляем строку к текущему блоку
    if (line.trim() !== '') {
      currentContent.push(line);
    }
  }

  // Сохраняем последний блок
  if (currentContent.length > 0) {
    blocks.push({
      blockId: currentBlockId,
      content: currentContent.join('\n'),
    });
  }

  // Конвертируем блоки в ProseMirror JSON
  const content = blocks.map((block) => {
    const text = block.content.trim();
    
    // Определяем тип блока
    if (text.startsWith('#')) {
      const level = text.match(/^#+/)?.[0].length || 1;
      const content = text.replace(/^#+\s*/, '');
      return {
        type: 'heading',
        attrs: { level, blockId: block.blockId },
        content: content ? [{ type: 'text', text: content }] : [],
      };
    }
    
    if (text.startsWith('```')) {
      const code = text.replace(/^```.*\n/, '').replace(/\n```$/, '');
      return {
        type: 'codeBlock',
        attrs: { blockId: block.blockId },
        content: code ? [{ type: 'text', text: code }] : [],
      };
    }
    
    if (text.startsWith('>')) {
      const content = text.replace(/^>\s*/, '');
      return {
        type: 'blockquote',
        attrs: { blockId: block.blockId },
        content: [
          {
            type: 'paragraph',
            content: content ? [{ type: 'text', text: content }] : [],
          },
        ],
      };
    }

    // По умолчанию - параграф
    return {
      type: 'paragraph',
      attrs: { blockId: block.blockId },
      content: text ? [{ type: 'text', text }] : [],
    };
  });

  return {
    type: 'doc',
    content,
  };
}

/**
 * Экспортирует документ в чистый Markdown без blockId комментариев
 */
export function exportToCleanMarkdown(doc: ProseMirrorNode): string {
  const markdown = serializeToMarkdown(doc);
  // Удаляем все HTML комментарии с blockId
  return markdown.replace(/<!--\s*block_id:[a-z0-9_]+\s*-->\n/g, '');
}

/**
 * Находит блок по blockId в документе
 */
export function findBlockById(doc: ProseMirrorNode, blockId: string): { node: ProseMirrorNode; pos: number } | null {
  let result: { node: ProseMirrorNode; pos: number } | null = null;
  
  doc.descendants((node, pos) => {
    if (node.attrs.blockId === blockId) {
      result = { node, pos };
      return false; // Останавливаем поиск
    }
  });
  
  return result;
}

/**
 * Получает контекст вокруг блока (соседние блоки)
 */
export function getBlockContext(doc: ProseMirrorNode, blockId: string, contextSize = 1): string {
  const blocks: ProseMirrorNode[] = [];
  let targetIndex = -1;
  
  doc.descendants((node) => {
    if (node.isBlock && node.attrs.blockId) {
      blocks.push(node);
      if (node.attrs.blockId === blockId) {
        targetIndex = blocks.length - 1;
      }
    }
  });
  
  if (targetIndex === -1) {
    return '';
  }
  
  const start = Math.max(0, targetIndex - contextSize);
  const end = Math.min(blocks.length, targetIndex + contextSize + 1);
  const contextBlocks = blocks.slice(start, end);
  
  const tempDoc = doc.type.schema.node('doc', null, contextBlocks);
  return exportToCleanMarkdown(tempDoc);
}

