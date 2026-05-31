import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperationLog } from '../common/decorators/operation-log.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import {
  CreateEmptyDocumentDto,
  CreateKnowledgeBaseDto,
  DeleteDocumentDto,
  DocumentFilterDto,
  DocumentListDto,
  IngestionLogsDto,
  KnowledgeBaseListDto,
  MetadataSummaryDto,
  ParseDocumentDto,
  SearchDto,
  UpdateDocumentsMetadataDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
  UpdateKnowledgeBaseDto,
  UpdateMetadataConfigDto,
} from './dto/knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('知识库')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('getKnowledgeBaseList')
  getKnowledgeBaseList(@Query() dto: KnowledgeBaseListDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.getList({ ...dto, userId: user.userId });
  }

  @Get('getDataPipelines')
  getDataPipelines() {
    return this.knowledgeService.getDataPipelines();
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '新增知识库')
  @Post('createKnowledgeBase')
  createKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.create(dto, user);
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '编辑知识库')
  @Put('updateKnowledgeBase/:id')
  updateKnowledgeBase(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.update(id, dto, user);
  }

  @Permissions('knowledge:delete')
  @OperationLog('知识库', '删除知识库')
  @Delete('deleteKnowledgeBase/:id')
  deleteKnowledgeBase(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.remove(id, user);
  }

  @Get('getDocumentList/:kbId')
  getDocumentList(@Param('kbId') kbId: string, @Query() dto: DocumentListDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.getDocumentList(kbId, dto, user);
  }

  @Get('getDocumentFilters/:kbId')
  getDocumentFilters(
    @Param('kbId') kbId: string,
    @Query() dto: DocumentFilterDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.getDocumentFilters(kbId, dto, user);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '上传文档')
  @Post('uploadDocument/:kbId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', 64))
  uploadDocument(@Param('kbId') kbId: string, @UploadedFiles() files: any[], @CurrentUser() user: { userId: string }) {
    if (!files?.length) throw new BadRequestException('缺少文档文件');
    return this.knowledgeService.uploadDocuments(
      kbId,
      files.map(file => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      })),
      user,
    );
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '新增空白文档')
  @Post('createEmptyDocument/:kbId')
  createEmptyDocument(
    @Param('kbId') kbId: string,
    @Body() dto: CreateEmptyDocumentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.createEmptyDocument(kbId, dto.name, user);
  }

  @Permissions('knowledge:delete')
  @OperationLog('知识库', '删除文档')
  @Delete('deleteDocuments/:kbId')
  deleteDocuments(@Param('kbId') kbId: string, @Body() dto: DeleteDocumentDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.deleteDocuments(kbId, dto.ids, user);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '解析文档')
  @Post('parseDocuments/:kbId')
  parseDocuments(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.parseDocuments(kbId, dto.ids, user, {
      delete: dto.delete,
      applyKb: dto.applyKb,
    });
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '停止解析')
  @Post('stopParsing/:kbId')
  stopParsing(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.stopParsing(kbId, dto.ids, user);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '执行解析任务')
  @Post('runDocuments/:kbId')
  runDocuments(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto, @CurrentUser() user: { userId: string }) {
    const run = (dto.run ?? 1) as 1 | 2;
    return this.knowledgeService.runDocuments(
      kbId,
      { ids: dto.ids, run, delete: dto.delete, applyKb: dto.applyKb },
      user,
    );
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '更新文档')
  @Put('updateDocument/:kbId/:docId')
  updateDocument(
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.updateDocument(kbId, docId, dto, user);
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '更新文档状态')
  @Post('updateDocumentStatus/:kbId')
  updateDocumentStatus(
    @Param('kbId') kbId: string,
    @Body() dto: UpdateDocumentStatusDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.updateDocumentStatus(kbId, dto, user);
  }

  @Get('previewDocument/:kbId/:docId')
  async previewDocument(
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: { userId: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.knowledgeService.previewDocument(kbId, docId, user);
    response.setHeader('Content-Type', file.contentType);
    if (file.contentDisposition) {
      response.setHeader('Content-Disposition', file.contentDisposition);
    }
    return new StreamableFile(file.buffer);
  }

  @Get('downloadDocument/:kbId/:docId')
  async downloadDocument(
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @Query('ext') ext: string | undefined,
    @CurrentUser() user: { userId: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.knowledgeService.downloadDocument(kbId, docId, ext, user);
    response.setHeader('Content-Type', file.contentType);
    if (file.contentDisposition) {
      response.setHeader('Content-Disposition', file.contentDisposition);
    }
    return new StreamableFile(file.buffer);
  }

  @Permissions('knowledge:search')
  @Post('search/:kbId')
  search(@Param('kbId') kbId: string, @Body() dto: SearchDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.search(kbId, dto, user);
  }

  @Get('ingestionSummary/:kbId')
  ingestionSummary(@Param('kbId') kbId: string, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.getIngestionSummary(kbId, user);
  }

  @Get('ingestionLogs/:kbId')
  ingestionLogs(
    @Param('kbId') kbId: string,
    @Query() dto: IngestionLogsDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.getIngestionLogs(kbId, dto, user);
  }

  @Get('ingestionLog/:kbId/:logId')
  ingestionLog(
    @Param('kbId') kbId: string,
    @Param('logId') logId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.getIngestionLog(kbId, logId, user);
  }

  @Get('metadataSummary/:kbId')
  metadataSummary(
    @Param('kbId') kbId: string,
    @Query() dto: MetadataSummaryDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.getMetadataSummary(kbId, dto, user);
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '批量更新文档元数据')
  @Patch('documentsMetadata/:kbId')
  documentsMetadata(
    @Param('kbId') kbId: string,
    @Body() dto: UpdateDocumentsMetadataDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.updateDocumentsMetadata(kbId, dto, user);
  }

  @Get('metadataConfig/:kbId')
  metadataConfig(@Param('kbId') kbId: string, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.getMetadataConfig(kbId, user);
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '更新知识库元数据配置')
  @Put('metadataConfig/:kbId')
  updateMetadataConfig(
    @Param('kbId') kbId: string,
    @Body() dto: UpdateMetadataConfigDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.updateMetadataConfig(kbId, dto, user);
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '更新文档元数据配置')
  @Put('documentMetadataConfig/:kbId/:docId')
  updateDocumentMetadataConfig(
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateMetadataConfigDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.knowledgeService.updateDocumentMetadataConfig(kbId, docId, dto, user);
  }
}
