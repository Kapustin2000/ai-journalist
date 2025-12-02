import { Node, mergeAttributes } from '@tiptap/core';
import { PluginKey, Plugin } from '@tiptap/pm/state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import ImageUpload from '~/components/Editor/Content/NodeView/ImageUpload.vue';
import api from '~/api';

export interface ImageUploadOptions {
  inline: boolean;
  allowBase64: boolean;
  documentId: string | undefined;
  HTMLAttributes: Record<string, any>;
}

export interface ImageUploadAttributes {
  src: string | null;
  alt: string | undefined;
  caption: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      setUploadImage: (options: {
        src?: string;
        alt?: string;
        caption?: string;
        documentId?: string;
        file?: File;
      }) => ReturnType;
    };
  }
}

export const ImageUploadNode = Node.create<
  ImageUploadOptions,
  ImageUploadAttributes
>({
  name: 'imageUpload',

  group: 'block',
  atom: false,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      documentId: {
        default: undefined,
      },
    };
  },

  addOptions() {
    return {
      inline: true,
      allowBase64: false,
      documentId: undefined,
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      setUploadImage:
        (options) =>
        ({ commands }) => {
          const { alt, documentId, file } = options;

          const uploadImage = async (file: File, documentId: string) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', `documents/${documentId}`);

            try {
              const response = await api.post('/uploadImage', formData);
              if (response.status === 200) {
                return response.data[0].path;
              } else if (response.status !== 200) {
                throw new Error('Image upload failed');
              }

              return response.status;
            } catch (error) {
              console.error('Failed to upload image:', error);
              throw new Error('Image upload failed');
            }
          };

          if (!documentId || !file) {
            console.error('Document ID and file are required');
            return false;
          }

          uploadImage(file, documentId)
            .then((uploadedImagePath) => {
              const fullPath = `https://asrp.media/storage/${uploadedImagePath}`;
              this.editor.commands.insertContent({
                type: this.name,
                attrs: {
                  src: fullPath,
                  alt: alt,
                  documentId: documentId,
                },
              });
              this.editor.commands.focus();
            })
            .catch((error) => {
              console.error('Error in setUploadImage:', error);
            });

          return true;
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        src: node.attrs.src,
        alt: node.attrs.alt,
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imageUploadHandler'),
        props: {
          handleDrop: (view, event) => {
            if (this.editor.isActive(this.type.name)) {
              return false;
            }

            const items = event.dataTransfer?.items;
            if (items) {
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) {
                    if (this.options.documentId) {
                      this.editor.commands.setUploadImage({
                        alt: file.name,
                        documentId: this.options.documentId,
                        file: file,
                      });
                    }
                    event.preventDefault();
                    return true;
                  }
                }
              }
            }
            return false;
          },
          handlePaste: (view, event) => {
            const items = event.clipboardData?.items;
            if (items) {
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) {
                    if (this.options.documentId) {
                      this.editor.commands.setUploadImage({
                        alt: file.name,
                        documentId: this.options.documentId,
                        file: file,
                      });
                    }
                    event.preventDefault();
                    return true;
                  }
                }
              }
            }
            return false;
          },
        },
      }),
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageUpload as any);
  },
});

export default ImageUploadNode;
