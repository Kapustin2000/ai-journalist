export type DocumentStatus = 'draft' | 'published' | 'archived';

export type DocumentBlock =
  | {
      type: 'tiptap';
      data: unknown;
    }
  | Record<string, any>;

export interface DocumentContent {
  blocks: DocumentBlock[];
  metadata?: Record<string, any>;
}

export interface DocumentSummary {
  id: string;
  projectId: string;
  resourceId: string;
  title?: string | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentHistoryEntry {
  id: string;
  timestamp: string;
  note?: string | null;
  content: DocumentContent;
}

export type DocumentUpdateState = 'pending' | 'applied' | 'rejected';

export interface DocumentUpdate {
  id: string;
  type: string;
  payload: Record<string, any>;
  state: DocumentUpdateState;
  note?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface DocumentRecord extends DocumentSummary {
  content: DocumentContent;
  pendingUpdates: DocumentUpdate[];
  history: DocumentHistoryEntry[];
}

export interface SaveDocumentPayload {
  title?: string | null;
  blocks: any[];
  metadata?: Record<string, any>;
  note?: string;
}

export interface ModifyUpdatesPayload {
  updateIds?: string[];
  note?: string;
}

