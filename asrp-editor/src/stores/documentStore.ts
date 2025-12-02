import { defineStore } from 'pinia';
import {
  fetchDocument,
  fetchDocuments,
  saveDocument,
  type SaveDocumentPayload,
} from '../services/api';
import type { DocumentRecord, DocumentSummary } from '../types/documents';

interface State {
  documents: DocumentSummary[];
  current?: DocumentRecord;
  loading: boolean;
}

export const useDocumentStore = defineStore('documents', {
  state: (): State => ({
    documents: [],
    current: undefined,
    loading: false,
  }),
  actions: {
    async list(pageRefresh = false) {
      if (this.loading && !pageRefresh) return;
      this.loading = true;
      try {
        this.documents = await fetchDocuments();
      } finally {
        this.loading = false;
      }
    },
    async load(id: string) {
      this.loading = true;
      try {
        this.current = await fetchDocument(id);
      } finally {
        this.loading = false;
      }
      return this.current;
    },
    async save(id: string, payload: SaveDocumentPayload) {
      this.loading = true;
      try {
        this.current = await saveDocument(id, payload);
      } finally {
        this.loading = false;
      }
      return this.current;
    },
  },
});

