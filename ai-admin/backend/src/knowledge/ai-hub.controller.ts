import { Controller, Get, UseGuards } from '@nestjs/common';
import { Body, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AiHubService } from './ai-hub.service';
import { AddAiModelDto, SetDefaultModelsDto } from './dto/ai-hub.dto';

@ApiTags('AI 中枢')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-hub')
export class AiHubController {
  constructor(private readonly aiHub: AiHubService) {}

  @Get('getReadiness')
  getReadiness() {
    return this.aiHub.getReadiness();
  }

  @Get('getModelConfig')
  getModelConfig() {
    return this.aiHub.getModelConfig();
  }

  @Post('addModel')
  @Permissions('model:config')
  addModel(@Body() dto: AddAiModelDto) {
    return this.aiHub.addModel(dto);
  }

  @Patch('setDefaultModels')
  @Permissions('model:config')
  setDefaultModels(@Body() dto: SetDefaultModelsDto) {
    return this.aiHub.setDefaultModels(dto);
  }
}
