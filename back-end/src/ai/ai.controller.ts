import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { RewriteBlockDto } from './dto/rewrite-block.dto';
import { InsertBlockDto } from './dto/insert-block.dto';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('rewrite-block')
  async rewriteBlock(@Body() dto: RewriteBlockDto) {
    return this.aiService.rewriteBlock(dto);
  }

  @Post('insert-block')
  async insertBlock(@Body() dto: InsertBlockDto) {
    return this.aiService.insertBlock(dto);
  }

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    return this.aiService.chat(dto);
  }

  @Post('improve-article')
  async improveArticle(@Body() dto: { documentId: string }) {
    return this.aiService.improveArticle(dto.documentId);
  }
}

