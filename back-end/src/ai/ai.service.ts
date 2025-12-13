import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { RewriteBlockDto } from './dto/rewrite-block.dto';
import { InsertBlockDto } from './dto/insert-block.dto';
import { ChatDto } from './dto/chat.dto';
import axios from 'axios';
import { randomUUID } from 'crypto';

interface AiOperation {
  id: string;
  documentId: string;
  type: string;
  status: string;
  input: any;
  output?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  documentId: string;
  role: string;
  content: string;
  createdAt: string;
}

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;
  private operations = new Map<string, AiOperation>();
  private chatMessages = new Map<string, ChatMessage[]>();
  private sessions = new Map<string, any>();

  constructor(private documentsService: DocumentsService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  }

  async rewriteBlock(dto: RewriteBlockDto) {
    const document = this.documentsService.getDocument(dto.documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const content = document.content;
    const block = this.findBlockById(content, dto.blockId);

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const blockText = this.blockToText(block);

    const operation: AiOperation = {
      id: randomUUID(),
      documentId: dto.documentId,
      type: 'rewrite',
      status: 'pending',
      input: {
        blockId: dto.blockId,
        instruction: dto.instruction,
        content: blockText,
      },
      createdAt: new Date().toISOString(),
    };
    this.operations.set(operation.id, operation);

    try {
      const startTime = Date.now();
      operation.status = 'processing';
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/rewrite-block`, {
        blockId: dto.blockId,
        content: blockText,
        instruction: dto.instruction,
        context: dto.context || this.getBlockContext(content, dto.blockId),
      }, {
        timeout: 120000, // 2 minutes for AI processing
      });

      const processingMs = Date.now() - startTime;

      operation.status = 'completed';
      operation.output = response.data;
      operation.completedAt = new Date().toISOString();

      // Add update to document
      const doc = this.documentsService.getDocument(dto.documentId);
      const updateId = randomUUID();
      doc.pendingUpdates.push({
        id: updateId,
        type: 'rewrite',
        payload: {
          blockId: dto.blockId,
          content: response.data.newContent,
          oldContent: blockText,
        },
        state: 'pending',
        note: response.data.note || 'AI rewrite suggestion',
        createdAt: new Date().toISOString(),
      });

      return {
        updateId,
        preview: response.data.newContent,
        note: response.data.note,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      operation.status = 'failed';
      operation.error = error.message;
      operation.completedAt = new Date().toISOString();
      
      const doc = this.documentsService.getDocument(dto.documentId);
      const updateId = randomUUID();
      doc.pendingUpdates.push({
        id: updateId,
        type: 'rewrite',
        payload: {
          blockId: dto.blockId,
          content: `[AI would rewrite]: ${blockText}\n\nInstruction: ${dto.instruction}`,
          oldContent: blockText,
        },
        state: 'pending',
        note: 'AI service is not available - this is a mock response',
        createdAt: new Date().toISOString(),
      });

      return {
        updateId,
        preview: `[AI would rewrite]: ${blockText}\n\nInstruction: ${dto.instruction}`,
        note: 'AI service is not available - this is a mock response',
      };
    }
  }

  async insertBlock(dto: InsertBlockDto) {
    const document = this.documentsService.getDocument(dto.documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const content = document.content;

    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/insert-block`, {
        insertAfter: dto.insertAfter,
        instruction: dto.instruction,
        context: dto.context || this.getBlockContext(content, dto.insertAfter),
      }, {
        timeout: 120000, // 2 minutes for AI processing
      });

      const doc = this.documentsService.getDocument(dto.documentId);
      const updateId = randomUUID();
      doc.pendingUpdates.push({
        id: updateId,
        type: 'insert',
        payload: {
          insertAfter: dto.insertAfter,
          content: response.data.newContent,
        },
        state: 'pending',
        note: response.data.note || 'AI insert suggestion',
        createdAt: new Date().toISOString(),
      });

      return {
        updateId,
        preview: response.data.newContent,
        note: response.data.note,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      const doc = this.documentsService.getDocument(dto.documentId);
      const updateId = randomUUID();
      const mockContent = `[AI would insert new content here]\n\nInstruction: ${dto.instruction}`;
      
      doc.pendingUpdates.push({
        id: updateId,
        type: 'insert',
        payload: {
          insertAfter: dto.insertAfter,
          content: mockContent,
        },
        state: 'pending',
        note: 'AI service is not available - this is a mock response',
        createdAt: new Date().toISOString(),
      });

      return {
        updateId,
        preview: mockContent,
        note: 'AI service is not available - this is a mock response',
      };
    }
  }

  async chat(dto: ChatDto) {
    const document = this.documentsService.getDocument(dto.documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const content = document.content;
    const documentInfo = this.getDocumentInfo(content);

    // Get or create session
    let session = this.sessions.get(dto.documentId);
    if (!session) {
      session = {
        id: randomUUID(),
        documentId: dto.documentId,
        createdAt: new Date().toISOString(),
      };
      this.sessions.set(dto.documentId, session);
      this.chatMessages.set(session.id, []);
    }

    // Save user message
    const userMessage: ChatMessage = {
      id: randomUUID(),
      sessionId: session.id,
      documentId: dto.documentId,
      role: 'user',
      content: dto.message,
      createdAt: new Date().toISOString(),
    };
    
    const messages = this.chatMessages.get(session.id) || [];
    messages.push(userMessage);
    this.chatMessages.set(session.id, messages);

    try {
      console.log('\n' + '='.repeat(80));
      console.log('🤖 Backend: Sending request to AI service');
      console.log('='.repeat(80));
      console.log(`📤 URL: ${this.aiServiceUrl}/api/v1/chat`);
      console.log(`📨 Message: ${dto.message}`);
      console.log(`📄 Document ID: ${dto.documentId}`);
      console.log(`📋 Document info: ${documentInfo.substring(0, 200)}...`);
      console.log(`📊 Content blocks: ${content.blocks?.length || 0}`);
      
      const requestPayload = {
        documentContent: JSON.stringify(content),
        message: dto.message,
        selectedBlockId: dto.selectedBlockId,
        documentInfo,
      };
      
      console.log(`📦 Payload size: ${JSON.stringify(requestPayload).length} bytes`);
      console.log('⏳ Waiting for AI service response...\n');
      
      const startTime = Date.now();
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/chat`, requestPayload, {
        timeout: 120000, // 2 minutes for AI processing
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ AI service responded in ${duration}ms`);
      console.log(`📥 Response status: ${response.status}`);
      console.log(`📥 Response data keys: ${Object.keys(response.data).join(', ')}`);
      console.log(`📥 Message length: ${response.data.message?.length || 0} chars`);
      console.log(`📥 Message preview: ${response.data.message?.substring(0, 200) || 'No message'}...`);
      console.log('='.repeat(80) + '\n');

      // Save assistant message
      const assistantMessage: ChatMessage = {
        id: randomUUID(),
        sessionId: session.id,
        documentId: dto.documentId,
        role: 'assistant',
        content: response.data.message,
        createdAt: new Date().toISOString(),
      };
      
      messages.push(assistantMessage);

      return {
        id: assistantMessage.id,
        message: response.data.message,
        updates: response.data.updates || [],
      };
    } catch (error: any) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ Backend: AI Service Error');
      console.error('='.repeat(80));
      console.error(`Error type: ${error.constructor.name}`);
      console.error(`Error message: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${JSON.stringify(error.response.data).substring(0, 500)}`);
      }
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      console.error('='.repeat(80) + '\n');

      const mockMessage: ChatMessage = {
        id: randomUUID(),
        sessionId: session.id,
        documentId: dto.documentId,
        role: 'assistant',
        content: `I understand you want to: "${dto.message}". AI service is currently not available, but I would help you with that task.`,
        createdAt: new Date().toISOString(),
      };
      
      messages.push(mockMessage);

      return {
        id: mockMessage.id,
        message: mockMessage.content,
        updates: [],
      };
    }
  }

  async improveArticle(documentId: string) {
    const document = this.documentsService.getDocument(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/improve-article`, {
        documentId,
        content: document.content,
      }, {
        timeout: 60000, // 60 seconds for full article improvement
      });

      return {
        message: response.data.message,
        updates: response.data.updates || [],
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      return {
        message: 'AI service is not available. Please try again later.',
        updates: [],
      };
    }
  }

  // Helper methods
  private findBlockById(content: any, blockId: string): any {
    const find = (node: any): any => {
      if (node.attrs?.blockId === blockId) {
        return node;
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          const found = find(child);
          if (found) return found;
        }
      }
      return null;
    };
    return find(content);
  }

  private blockToText(block: any): string {
    if (!block) return '';
    
    // Extract text from block
    if (block.type === 'text') {
      return block.text || '';
    }
    
    if (block.content && Array.isArray(block.content)) {
      return block.content
        .map((child: any) => this.blockToText(child))
        .join('');
    }
    
    return '';
  }

  private getBlockContext(content: any, blockId: string, contextSize = 1): string {
    const blocks: any[] = [];
    let targetIndex = -1;

    const collectBlocks = (node: any) => {
      if (node.attrs?.blockId) {
        blocks.push(node);
        if (node.attrs.blockId === blockId) {
          targetIndex = blocks.length - 1;
        }
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(collectBlocks);
      }
    };

    collectBlocks(content);

    if (targetIndex === -1) {
      return '';
    }

    const start = Math.max(0, targetIndex - contextSize);
    const end = Math.min(blocks.length, targetIndex + contextSize + 1);
    const contextBlocks = blocks.slice(start, end);

    return contextBlocks
      .map((block) => this.blockToText(block))
      .filter((text) => text.trim())
      .join('\n\n');
  }

  private getDocumentInfo(content: any): string {
    const blocks: any[] = [];

    const collectBlocks = (node: any) => {
      if (node.attrs?.blockId) {
        blocks.push({
          type: node.type,
          level: node.attrs.level,
          id: node.attrs.blockId,
        });
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(collectBlocks);
      }
    };

    collectBlocks(content);

    return `Document has ${blocks.length} blocks:\n${blocks
      .map((b, i) => `${i + 1}. ${b.type}${b.level ? ` (level ${b.level})` : ''} - ${b.id}`)
      .join('\n')}`;
  }
}

