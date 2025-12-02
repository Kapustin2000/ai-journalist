import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DocumentContent,
  DocumentHistoryEntry,
  DocumentRecord,
  DocumentStatus,
  DocumentUpdate,
} from './interfaces/document.interface';
import { SaveDocumentDto } from './dto/save-document.dto';
import { ModifyUpdatesDto } from './dto/modify-updates.dto';

interface CreateDocumentOptions {
  projectId: string;
  resourceId: string;
  title?: string;
  blocks?: any[];
  metadata?: Record<string, any>;
}

type DocumentSummary = Pick<
  DocumentRecord,
  'id' | 'projectId' | 'resourceId' | 'title' | 'status' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class DocumentsService {
  private readonly documents = new Map<string, DocumentRecord>();
  private readonly documentsByComposite = new Map<string, string>();

  listDocuments(): DocumentSummary[] {
    return Array.from(this.documents.values()).map(
      ({ id, projectId, resourceId, title, status, createdAt, updatedAt }) => ({
        id,
        projectId,
        resourceId,
        title,
        status,
        createdAt,
        updatedAt,
      }),
    );
  }

  createDocument(options: CreateDocumentOptions): DocumentRecord {
    const compositeId = this.buildCompositeId(options.projectId, options.resourceId);
    const existingId = this.documentsByComposite.get(compositeId);
    if (existingId) {
      const existing = this.documents.get(existingId);
      if (!existing) {
        throw new NotFoundException(`Document ${existingId} not found`);
      }
      return existing;
    }

    const now = new Date().toISOString();
    const content: DocumentContent = {
      blocks: options.blocks ?? [],
      metadata: options.metadata ?? {},
    };

    const document: DocumentRecord = {
      id: randomUUID(),
      projectId: options.projectId,
      resourceId: options.resourceId,
      title: options.title ?? 'Untitled',
      status: 'draft',
      content,
      pendingUpdates: [],
      history: [
        {
          id: randomUUID(),
          timestamp: now,
          note: 'Document created',
          content: this.cloneContent(content),
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(document.id, document);
    this.documentsByComposite.set(compositeId, document.id);
    return document;
  }

  findByProjectResource(projectId: string, resourceId: string): DocumentRecord | null {
    const compositeId = this.buildCompositeId(projectId, resourceId);
    const documentId = this.documentsByComposite.get(compositeId);
    if (!documentId) {
      return null;
    }
    const document = this.documents.get(documentId);
    return document ?? null;
  }

  getDocument(id: string): DocumentRecord {
    const document = this.documents.get(id);
    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return document;
  }

  saveDocument(id: string, dto: SaveDocumentDto): DocumentRecord {
    const document = this.getDocument(id);
    if (!Array.isArray(dto.blocks)) {
      throw new BadRequestException('blocks must be an array');
    }

    document.content = {
      blocks: dto.blocks,
      metadata: dto.metadata ?? {},
    };
    if (dto.title) {
      document.title = dto.title;
    }

    const timestamp = new Date().toISOString();
    document.history.unshift({
      id: randomUUID(),
      timestamp,
      note: dto.note ?? 'Manual save',
      content: this.cloneContent(document.content),
    });
    document.updatedAt = timestamp;

    return document;
  }

  getHistory(id: string): DocumentHistoryEntry[] {
    const document = this.getDocument(id);
    return document.history;
  }

  getPendingUpdates(id: string): DocumentUpdate[] {
    const document = this.getDocument(id);
    return document.pendingUpdates;
  }

  applyUpdates(id: string, dto: ModifyUpdatesDto): DocumentUpdate[] {
    const document = this.getDocument(id);
    const targetIds = this.resolveUpdateIds(document, dto.updateIds);
    const now = new Date().toISOString();
    const applied: DocumentUpdate[] = [];

    document.pendingUpdates = document.pendingUpdates.filter((update) => {
      if (!targetIds.includes(update.id)) {
        return true;
      }

      update.state = 'applied';
      update.resolvedAt = now;
      update.note = dto.note ?? update.note;
      applied.push(update);
      return false;
    });

    if (applied.length) {
      document.history.unshift({
        id: randomUUID(),
        timestamp: now,
        note: dto.note ?? `Applied ${applied.length} update(s)`,
        content: this.cloneContent(document.content),
      });
      document.updatedAt = now;
    }

    return applied;
  }

  rejectUpdates(id: string, dto: ModifyUpdatesDto): DocumentUpdate[] {
    const document = this.getDocument(id);
    const targetIds = this.resolveUpdateIds(document, dto.updateIds);
    const now = new Date().toISOString();
    const rejected: DocumentUpdate[] = [];

    document.pendingUpdates = document.pendingUpdates.filter((update) => {
      if (!targetIds.includes(update.id)) {
        return true;
      }
      update.state = 'rejected';
      update.resolvedAt = now;
      update.note = dto.note ?? update.note;
      rejected.push(update);
      return false;
    });

    return rejected;
  }

  clearUpdates(id: string): void {
    const document = this.getDocument(id);
    document.pendingUpdates = [];
  }

  getStatus(id: string): DocumentStatus {
    const document = this.getDocument(id);
    return document.status;
  }

  updateStatus(id: string, status: DocumentStatus): DocumentRecord {
    const document = this.getDocument(id);
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    document.status = status;
    document.updatedAt = new Date().toISOString();
    return document;
  }

  private resolveUpdateIds(document: DocumentRecord, updateIds?: string[]): string[] {
    if (updateIds && updateIds.length === 0) {
      throw new BadRequestException('updateIds cannot be empty');
    }

    if (!updateIds) {
      return document.pendingUpdates.map((update) => update.id);
    }

    const missing = updateIds.filter(
      (id) => !document.pendingUpdates.some((update) => update.id === id),
    );
    if (missing.length) {
      throw new NotFoundException(`Updates not found: ${missing.join(', ')}`);
    }
    return updateIds;
  }

  private buildCompositeId(projectId: string, resourceId: string): string {
    return `${projectId}::${resourceId}`.toLowerCase();
  }

  private cloneContent(content: DocumentContent): DocumentContent {
    return JSON.parse(JSON.stringify(content));
  }
}

