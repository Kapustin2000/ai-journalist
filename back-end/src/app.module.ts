import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { SessionsModule } from './sessions/sessions.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [DocumentsModule, SessionsModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
