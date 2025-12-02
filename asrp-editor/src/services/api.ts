import axios from 'axios';
import type {
  DocumentHistoryEntry,
  DocumentRecord,
  DocumentStatus,
  DocumentSummary,
  DocumentUpdate,
  ModifyUpdatesPayload,
  SaveDocumentPayload,
} from '../types/documents';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDocuments = async (): Promise<DocumentSummary[]> => {
  const { data } = await api.get<DocumentSummary[]>('/documents');
  return data;
};

export const fetchDocument = async (id: string): Promise<DocumentRecord> => {
  const { data } = await api.get<DocumentRecord>(`/documents/${id}`);
  return data;
};

export const saveDocument = async (id: string, payload: SaveDocumentPayload) => {
  const { data } = await api.post<DocumentRecord>(`/documents/${id}/save`, payload);
  return data;
};

export const fetchHistory = async (id: string): Promise<DocumentHistoryEntry[]> => {
  const { data } = await api.get<DocumentHistoryEntry[]>(`/documents/${id}/history`);
  return data;
};

export const fetchUpdates = async (id: string): Promise<DocumentUpdate[]> => {
  const { data } = await api.get<DocumentUpdate[]>(`/documents/${id}/updates`);
  return data;
};

export const applyUpdates = async (id: string, payload: ModifyUpdatesPayload = {}) => {
  const { data } = await api.post<DocumentUpdate[]>(`/documents/${id}/updates/apply`, payload);
  return data;
};

export const rejectUpdates = async (id: string, payload: ModifyUpdatesPayload = {}) => {
  const { data } = await api.post<DocumentUpdate[]>(`/documents/${id}/updates/reject`, payload);
  return data;
};

export const clearUpdates = async (id: string) => {
  await api.delete(`/documents/${id}/updates`);
};

export const fetchStatus = async (id: string): Promise<DocumentStatus> => {
  const { data } = await api.get<{ status: DocumentStatus }>(`/documents/${id}/status`);
  return data.status;
};

export const updateStatus = async (id: string, status: DocumentStatus) => {
  const { data } = await api.patch<DocumentRecord>(`/documents/${id}/status`, { status });
  return data;
};

export const createSession = async (payload: {
  projectId: string;
  resourceId: string;
  title?: string;
  blocks?: any[];
  metadata?: Record<string, any>;
}) => {
  const { data } = await api.post(`/sessions`, payload);
  return data;
};

