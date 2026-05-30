import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperationLog } from '../common/decorators/operation-log.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import {
  CreateKnowledgeBaseDto,
  DeleteDocumentDto,
  DocumentListDto,
  KnowledgeBaseListDto,
  ParseDocumentDto,
  SearchDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
  UpdateKnowledgeBaseDto,
} from './dto/knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('知识库')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

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
  updateKnowledgeBase(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto, @CurrentUser() user: { userId: string }) {
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

  @Permissions('knowledge:add')
  @OperationLog('知识库', '上传文档')
  @Post('uploadDocument/:kbId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@Param('kbId') kbId: string, @UploadedFile() file: any, @CurrentUser() user: { userId: string }) {
    if (!file) throw new BadRequestException('缺少文件');
    return this.knowledgeService.uploadDocument(kbId, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    }, user);
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
    return this.knowledgeService.parseDocuments(kbId, dto.ids, user);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '停止解析')
  @Post('stopParsing/:kbId')
  stopParsing(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.stopParsing(kbId, dto.ids, user);
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
}
