import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { SaveDocumentDto } from './dto/save-document.dto';
import { ModifyUpdatesDto } from './dto/modify-updates.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list() {
    return this.documentsService.listDocuments();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.documentsService.getDocument(id);
  }

  @Post(':id/save')
  save(@Param('id') id: string, @Body() dto: SaveDocumentDto) {
    return this.documentsService.saveDocument(id, dto);
  }

  @Get(':id/history')
  history(@Param('id') id: string) {
    return this.documentsService.getHistory(id);
  }

  @Get(':id/updates')
  updates(@Param('id') id: string) {
    return this.documentsService.getPendingUpdates(id);
  }

  @Post(':id/updates/apply')
  applyUpdates(@Param('id') id: string, @Body() dto: ModifyUpdatesDto) {
    return this.documentsService.applyUpdates(id, dto);
  }

  @Post(':id/updates/reject')
  rejectUpdates(@Param('id') id: string, @Body() dto: ModifyUpdatesDto) {
    return this.documentsService.rejectUpdates(id, dto);
  }

  @Delete(':id/updates')
  clearUpdates(@Param('id') id: string) {
    this.documentsService.clearUpdates(id);
    return { ok: true };
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return { status: this.documentsService.getStatus(id) };
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.documentsService.updateStatus(id, dto.status);
  }
}

