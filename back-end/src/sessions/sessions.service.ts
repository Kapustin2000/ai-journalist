import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DocumentsService } from '../documents/documents.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DocumentRecord } from '../documents/interfaces/document.interface';

export interface SessionRecord {
  id: string;
  documentId: string;
  projectId: string;
  resourceId: string;
  createdAt: string;
}

@Injectable()
export class SessionsService {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly documentsService: DocumentsService) {}

  createSession(dto: CreateSessionDto) {
    let document: DocumentRecord | null = this.documentsService.findByProjectResource(
      dto.projectId,
      dto.resourceId,
    );

    if (!document) {
      document = this.documentsService.createDocument({
        projectId: dto.projectId,
        resourceId: dto.resourceId,
        title: dto.title,
        blocks: dto.blocks,
        metadata: dto.metadata,
      });
    }

    const session: SessionRecord = {
      id: randomUUID(),
      documentId: document.id,
      projectId: dto.projectId,
      resourceId: dto.resourceId,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);

    return {
      session,
      document,
    };
  }
}

