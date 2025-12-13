<template>
  <div class="layout">
    <header class="page-header">
      <div>
        <h1>ASRP Editor Dev</h1>
        <p>UI для проверки API Nest.js без прямого доступа к AI-пайплайну.</p>
      </div>
      <div class="header-actions">
        <span>API: {{ apiUrl }}</span>
        <button class="ghost" @click="refreshAll" :disabled="loadingList">Обновить всё</button>
      </div>
    </header>
    <main class="grid">
      <section>
        <SessionCreator @create="handleSessionCreate" />
        <DocumentList
          class="mt"
          :documents="documents"
          :selected-id="selectedDocument?.id ?? null"
          @select="selectDocument"
          @refresh="loadDocuments"
        />
      </section>
      <section class="editor-column">
        <DocumentEditor
          :document="selectedDocument"
          :status="currentStatus"
          @save="handleSave"
          @change-status="handleStatusChange"
          @apply-updates="applyAll"
          @reject-updates="rejectAll"
        />
      </section>
      <section>
        <HistoryPanel
          :document-id="selectedDocument?.id"
          :history="history"
          @refresh="loadHistory"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DocumentList from './components/DocumentList.vue';
import DocumentEditor from './components/DocumentEditor.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import SessionCreator from './components/SessionCreator.vue';
import {
  applyUpdates,
  clearUpdates,
  createSession,
  fetchDocument,
  fetchDocuments,
  fetchHistory,
  fetchStatus,
  fetchUpdates,
  rejectUpdates,
  saveDocument,
  updateStatus,
} from './services/api';
import type {
  DocumentHistoryEntry,
  DocumentRecord,
  DocumentStatus,
  DocumentSummary,
  DocumentUpdate,
} from './types/documents';
import { buildDefaultBlocks } from './editor/defaultContent';

const documents = ref<DocumentSummary[]>([]);
const selectedDocument = ref<DocumentRecord | null>(null);
const history = ref<DocumentHistoryEntry[]>([]);
const updates = ref<DocumentUpdate[]>([]);
const currentStatus = ref<DocumentStatus | null>(null);
const loadingList = ref(false);

const apiUrl = computed(() => import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

const loadDocuments = async () => {
  loadingList.value = true;
  try {
    documents.value = await fetchDocuments();
  } finally {
    loadingList.value = false;
  }
};

const selectDocument = async (id: string) => {
  selectedDocument.value = await fetchDocument(id);
  await Promise.all([loadHistory(), loadUpdates(), loadStatus()]);
};

const loadHistory = async () => {
  if (!selectedDocument.value) return;
  history.value = await fetchHistory(selectedDocument.value.id);
};

const loadUpdates = async () => {
  if (!selectedDocument.value) return;
  updates.value = await fetchUpdates(selectedDocument.value.id);
};

const loadStatus = async () => {
  if (!selectedDocument.value) return;
  currentStatus.value = await fetchStatus(selectedDocument.value.id);
};

const handleSave = async (payload: {
  title?: string | null;
  blocks: any[];
  metadata?: Record<string, any>;
  note?: string;
}) => {
  if (!selectedDocument.value) return;
  const updated = await saveDocument(selectedDocument.value.id, payload);
  selectedDocument.value = updated;
  await loadHistory();
};

const handleStatusChange = async (status: DocumentStatus) => {
  if (!selectedDocument.value) return;
  selectedDocument.value = await updateStatus(selectedDocument.value.id, status);
  currentStatus.value = status;
};

const applyAll = async () => {
  if (!selectedDocument.value) return;
  await applyUpdates(selectedDocument.value.id, {});
  await loadUpdates();
  await loadHistory();
};

const rejectAll = async () => {
  if (!selectedDocument.value) return;
  await rejectUpdates(selectedDocument.value.id, {});
  await loadUpdates();
};

const clearAll = async () => {
  if (!selectedDocument.value) return;
  await clearUpdates(selectedDocument.value.id);
  await loadUpdates();
};

const handleSessionCreate = async (payload: {
  projectId: string;
  resourceId: string;
  title?: string;
  comment?: string;
}) => {
  const { document } = await createSession({
    projectId: payload.projectId,
    resourceId: payload.resourceId,
    title: payload.title,
    blocks: buildDefaultBlocks(),
    metadata: payload.comment ? { comment: payload.comment } : undefined,
  });
  await loadDocuments();
  await selectDocument(document.id);
};

const refreshAll = async () => {
  await loadDocuments();
  if (selectedDocument.value) {
    await selectDocument(selectedDocument.value.id);
  }
};

loadDocuments();
</script>

<style scoped>
.layout {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 2.4fr) 360px;
  gap: 24px;
  width: 100%;
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mt {
  margin-top: 16px;
}

.ghost {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 1400px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .layout {
    padding: 24px;
  }
}
</style>

<style>
/* TipTap Editor Styles */
.tiptap {
  outline: none;
}

.tiptap p {
  line-height: 1.6;
  margin: 1rem 0;
}

.tiptap h1,
.tiptap h2,
.tiptap h3 {
  width: 100%;
  margin: 1.5rem 0 1rem;
  font-weight: bold;
  line-height: 1.3;
}

.tiptap h1 {
  font-size: 2rem;
}

.tiptap h2 {
  font-size: 1.75rem;
}

.tiptap h3 {
  font-size: 1.5rem;
}

.tiptap ul {
  list-style: disc;
  padding-inline-start: 1.5rem;
  margin: 1rem 0;
}

.tiptap ol {
  list-style: decimal;
  padding-inline-start: 1.5rem;
  margin: 1rem 0;
}

.tiptap li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.tiptap blockquote {
  border-inline-start: 4px solid #bebebe;
  padding-inline-start: 1rem;
  color: #666;
  font-style: italic;
  margin: 1rem 0;
}

.tiptap hr {
  border: 0;
  border-top: 1px solid #ccc;
  margin: 2rem 0;
}

.tiptap strong {
  font-weight: bold;
}

.tiptap em {
  font-style: italic;
}

.tiptap u {
  text-decoration: underline;
}

.tiptap s {
  text-decoration: line-through;
}

.tiptap a {
  color: #3498db;
  text-decoration: underline;
  cursor: pointer;
}

.tiptap a:hover {
  color: #2980b9;
}

.tiptap p.is-empty::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Remove blue border on focus */
.tiptap:focus {
  outline: none;
}

.ProseMirror-focused {
  outline: none !important;
}

/* Fix suggestion decoration */
.suggestion {
  color: rgba(0, 0, 0, 0.4);
}

.suggestion.is-empty {
  color: rgba(0, 0, 0, 0.4);
}
</style>

