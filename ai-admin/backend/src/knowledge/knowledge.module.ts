import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { RagflowApiService } from './ragflow-api.service';
import { KnowledgeAccessService } from './knowledge-access.service';
import { AiHubController } from './ai-hub.controller';
import { AiHubService } from './ai-hub.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnowledgeController, AiHubController],
  providers: [KnowledgeService, RagflowApiService, KnowledgeAccessService, AiHubService],
})
export class KnowledgeModule {}
