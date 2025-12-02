import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [DocumentsModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
