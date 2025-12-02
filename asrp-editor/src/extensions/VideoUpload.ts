import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import VideoUpload from '~/components/Editor/Content/NodeView/VideoUpload.vue';
import api from '~/api';

export interface VideoOptions {
  inline: boolean;
  allowBase64: boolean;
  documentId: string | undefined;
  HTMLAttributes: Record<string, any>;
}
export interface VideoAttributes {
  src: string | null;
  type: string | null;
  poster: string | null;
}
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: {
        src?: string;
        documentId?: string;
        file?: File;
        type?: string;
      }) => ReturnType;
    };
  }
}

const VIDEO_INPUT_REGEX = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export const VideoUploadNode = Node.create<VideoOptions, VideoAttributes>({
  name: 'videoUpload',

  group: 'inline',
  content: 'block*',
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => (el as HTMLSpanElement).getAttribute('src'),
        renderHTML: (attrs) => ({ src: attrs.src }),
      },
      type: {
        default: null,
        parseHTML: (el) => (el as HTMLSpanElement).getAttribute('type'),
        renderHTML: (attrs) => ({ type: attrs.type }),
      },
      poster: {
        default: null,
        parseHTML: (el) => (el as HTMLSpanElement).getAttribute('poster'),
        renderHTML: (attrs) => ({ poster: attrs.poster }),
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
      setVideo:
        (options) =>
        ({ commands }) => {
          const { documentId, file, type } = options;

          const uploadVideo = async (file: File, documentId: string) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', `documents/${documentId}`);
            try {
              const response = await api.post('/uploadFile', formData);
              if (response.status === 200) {
                return response.data[0].path;
              } else if (response.status !== 200) {
                throw new Error('Video upload failed');
              }
              return response.status;
            } catch (error) {
              console.error('Failed to upload video:', error);
              throw new Error('Video upload failed');
            }
          };

          if (!documentId || !file) {
            console.error('Document ID and file are required');
            return false;
          }

          uploadVideo(file, documentId)
            .then((uploadedVideoPath) => {
              const fullPath = `https://asrp.media/storage/${uploadedVideoPath}`;
              this.editor.commands.insertContent({
                type: this.name,
                attrs: {
                  src: fullPath,
                  documentId: documentId,
                  type: type,
                },
              });
              console.log(fullPath, 'success');

              this.editor.commands.focus();
            })
            .catch((error) => {
              console.error('Error in setVideo:', error);
            });

          return true;
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'custom-video',
      },
    ];
  },

  // renderHTML({ node, HTMLAttributes }) {
  //   return [
  //     'video',
  //     mergeAttributes(HTMLAttributes, {
  //       src: node.attrs.src,
  //       poster: node.attrs.poster || undefined,
  //       controls: 'false',
  //     }),
  //   ];
  // },

  // renderHTML({ node, HTMLAttributes }) {
  //   return [
  //     'video',
  //     mergeAttributes(HTMLAttributes, {
  //       src: node.attrs.src,
  //       poster: node.attrs.poster,
  //       controls: 'true',
  //       crossorigin: 'anonymous',
  //       class: 'w-full block',
  //     }),
  //     ['source', { src: node.attrs.src, type: node.attrs.type || 'video/mp4' }],
  //   ];
  // },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'custom-video',
      mergeAttributes(HTMLAttributes, {
        'data-src': node.attrs.src,
        'data-poster': node.attrs.poster,
        'data-type': node.attrs.type || 'video/mp4',
        class: 'w-full block',
      }),
    ];
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: VIDEO_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => {
          const [, , src] = match;

          return { src };
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('videoDropPlugin'),

        props: {
          handleDOMEvents: {
            drop(view, event) {
              const {
                state: { schema, tr },
                dispatch,
              } = view;
              const hasFiles =
                event.dataTransfer &&
                event.dataTransfer.files &&
                event.dataTransfer.files.length;

              if (!hasFiles) return false;

              const videos = Array.from(event.dataTransfer.files).filter(
                (file) => /video/i.test(file.type)
              );

              if (videos.length === 0) return false;

              event.preventDefault();

              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              videos.forEach((video) => {
                const reader = new FileReader();

                reader.onload = (readerEvent) => {
                  const node = schema.nodes.videoUpload.create({
                    src: readerEvent.target?.result,
                  });

                  if (coordinates && typeof coordinates.pos === 'number') {
                    const transaction = tr.insert(coordinates?.pos, node);

                    dispatch(transaction);
                  }
                };

                reader.readAsDataURL(video);
              });

              return true;
            },
          },
        },
      }),
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(VideoUpload as any);
  },

  // addNodeView() {
  //   return VueNodeViewRenderer(VideoUpload);
  // },
});
