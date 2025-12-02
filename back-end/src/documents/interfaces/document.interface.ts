export type DocumentStatus = 'draft' | 'published' | 'archived';

export interface DocumentContent {
  blocks: any[];
  metadata?: Record<string, any>;
}

export interface DocumentHistoryEntry {
  id: string;
  timestamp: string;
  note?: string;
  content: DocumentContent;
}

export type DocumentUpdateState = 'pending' | 'applied' | 'rejected';

export interface DocumentUpdate {
  id: string;
  type: 'insert' | 'rewrite' | 'delete' | string;
  payload: Record<string, any>;
  state: DocumentUpdateState;
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  resourceId: string;
  title?: string;
  status: DocumentStatus;
  content: DocumentContent;
  pendingUpdates: DocumentUpdate[];
  history: DocumentHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

