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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
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

  @Permissions('knowledge:add')
  @OperationLog('知识库', '新增知识库')
  @Post('createKnowledgeBase')
  createKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.create(dto);
  }

  @Permissions('knowledge:edit')
  @OperationLog('知识库', '编辑知识库')
  @Put('updateKnowledgeBase/:id')
  updateKnowledgeBase(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.knowledgeService.update(id, dto);
  }

  @Permissions('knowledge:delete')
  @OperationLog('知识库', '删除知识库')
  @Delete('deleteKnowledgeBase/:id')
  deleteKnowledgeBase(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }

  @Get('getDocumentList/:kbId')
  getDocumentList(@Param('kbId') kbId: string, @Query() dto: DocumentListDto) {
    return this.knowledgeService.getDocumentList(kbId, dto);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '上传文档')
  @Post('uploadDocument/:kbId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@Param('kbId') kbId: string, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('缺少文件');
    return this.knowledgeService.uploadDocument(kbId, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
  }

  @Permissions('knowledge:delete')
  @OperationLog('知识库', '删除文档')
  @Delete('deleteDocuments/:kbId')
  deleteDocuments(@Param('kbId') kbId: string, @Body() dto: DeleteDocumentDto) {
    return this.knowledgeService.deleteDocuments(kbId, dto.ids);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '解析文档')
  @Post('parseDocuments/:kbId')
  parseDocuments(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto) {
    return this.knowledgeService.parseDocuments(kbId, dto.ids);
  }

  @Permissions('knowledge:add')
  @OperationLog('知识库', '停止解析')
  @Post('stopParsing/:kbId')
  stopParsing(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto) {
    return this.knowledgeService.stopParsing(kbId, dto.ids);
  }

  @Permissions('knowledge:search')
  @Post('search/:kbId')
  search(@Param('kbId') kbId: string, @Body() dto: SearchDto) {
    return this.knowledgeService.search(kbId, dto);
  }
}
