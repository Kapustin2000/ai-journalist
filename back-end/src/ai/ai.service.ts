import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RewriteBlockDto } from './dto/rewrite-block.dto';
import { InsertBlockDto } from './dto/insert-block.dto';
import { ChatDto } from './dto/chat.dto';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;

  constructor(private prisma: PrismaService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  }

  async rewriteBlock(dto: RewriteBlockDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const content = document.content as any;
    const block = this.findBlockById(content, dto.blockId);

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const blockText = this.blockToText(block);

    // Create AI operation record
    const operation = await this.prisma.aiOperation.create({
      data: {
        documentId: dto.documentId,
        type: 'rewrite',
        status: 'pending',
        input: {
          blockId: dto.blockId,
          instruction: dto.instruction,
          content: blockText,
        },
        metadata: {
          blockId: dto.blockId,
          blockType: block.type,
        },
      },
    });

    try {
      const startTime = Date.now();
      
      await this.prisma.aiOperation.update({
        where: { id: operation.id },
        data: { status: 'processing' },
      });
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/rewrite-block`, {
        blockId: dto.blockId,
        content: blockText,
        instruction: dto.instruction,
        context: dto.context || this.getBlockContext(content, dto.blockId),
      }, {
        timeout: 30000,
      });

      const processingMs = Date.now() - startTime;

      await this.prisma.aiOperation.update({
        where: { id: operation.id },
        data: {
          status: 'completed',
          output: response.data,
          processingMs,
          tokensUsed: response.data.tokensUsed,
          completedAt: new Date(),
        },
      });

      const update = await this.prisma.documentUpdate.create({
        data: {
          documentId: dto.documentId,
          type: 'rewrite',
          payload: {
            blockId: dto.blockId,
            content: response.data.newContent,
            oldContent: blockText,
          },
          state: 'pending',
          note: response.data.note || 'AI rewrite suggestion',
        },
      });

      return {
        updateId: update.id,
        preview: response.data.newContent,
        note: response.data.note,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      await this.prisma.aiOperation.update({
        where: { id: operation.id },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });
      
      const mockUpdate = await this.prisma.documentUpdate.create({
        data: {
          documentId: dto.documentId,
          type: 'rewrite',
          payload: {
            blockId: dto.blockId,
            content: `[AI would rewrite]: ${blockText}\n\nInstruction: ${dto.instruction}`,
            oldContent: blockText,
          },
          state: 'pending',
          note: 'AI service is not available - this is a mock response',
        },
      });

      return {
        updateId: mockUpdate.id,
        preview: (mockUpdate.payload as any)?.content || '',
        note: mockUpdate.note,
      };
    }
  }

  async insertBlock(dto: InsertBlockDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const content = document.content as any;

    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/insert-block`, {
        insertAfter: dto.insertAfter,
        instruction: dto.instruction,
        context: dto.context || this.getBlockContext(content, dto.insertAfter),
      }, {
        timeout: 30000,
      });

      const update = await this.prisma.documentUpdate.create({
        data: {
          documentId: dto.documentId,
          type: 'insert',
          payload: {
            insertAfter: dto.insertAfter,
            content: response.data.newContent,
          },
          state: 'pending',
          note: response.data.note || 'AI insert suggestion',
        },
      });

      return {
        updateId: update.id,
        preview: response.data.newContent,
        note: response.data.note,
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      const mockUpdate = await this.prisma.documentUpdate.create({
        data: {
          documentId: dto.documentId,
          type: 'insert',
          payload: {
            insertAfter: dto.insertAfter,
            content: `[AI would insert new content here]\n\nInstruction: ${dto.instruction}`,
          },
          state: 'pending',
          note: 'AI service is not available - this is a mock response',
        },
      });

      return {
        updateId: mockUpdate.id,
        preview: (mockUpdate.payload as any)?.content || '',
        note: mockUpdate.note,
      };
    }
  }

  async chat(dto: ChatDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const content = document.content as any;
    const documentInfo = this.getDocumentInfo(content);

    // Get or create AI session
    let session = await this.prisma.aiSession.findFirst({
      where: { documentId: dto.documentId },
      orderBy: { lastActiveAt: 'desc' },
    });

    if (!session) {
      session = await this.prisma.aiSession.create({
        data: {
          documentId: dto.documentId,
          metadata: { documentInfo },
        },
      });
    }

    // Save user message
    await this.prisma.aiChatMessage.create({
      data: {
        sessionId: session.id,
        documentId: dto.documentId,
        role: 'user',
        content: dto.message,
        metadata: { selectedBlockId: dto.selectedBlockId },
      },
    });

    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/chat`, {
        documentContent: JSON.stringify(content),
        message: dto.message,
        selectedBlockId: dto.selectedBlockId,
        documentInfo,
      }, {
        timeout: 30000,
      });

      // Save assistant message
      const assistantMessage = await this.prisma.aiChatMessage.create({
        data: {
          sessionId: session.id,
          documentId: dto.documentId,
          role: 'assistant',
          content: response.data.message,
          metadata: { updates: response.data.updates },
        },
      });

      // Update session
      await this.prisma.aiSession.update({
        where: { id: session.id },
        data: {
          messageCount: { increment: 2 },
          lastActiveAt: new Date(),
        },
      });

      return {
        id: assistantMessage.id,
        message: response.data.message,
        updates: response.data.updates || [],
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      const mockMessage = await this.prisma.aiChatMessage.create({
        data: {
          sessionId: session.id,
          documentId: dto.documentId,
          role: 'assistant',
          content: `I understand you want to: "${dto.message}". AI service is currently not available, but I would help you with that task.`,
        },
      });

      await this.prisma.aiSession.update({
        where: { id: session.id },
        data: {
          messageCount: { increment: 2 },
          lastActiveAt: new Date(),
        },
      });

      return {
        id: mockMessage.id,
        message: mockMessage.content,
        updates: [],
      };
    }
  }

  async improveArticle(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

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

