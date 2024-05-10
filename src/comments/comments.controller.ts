import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '../decorators/current-user-param.decorator';
import { LikeInputDto } from '../reactions/likeInput.dto';
import { BearerAuthGuard } from '../users/guards/bearer.auth.guard';
import { CommentsQueryRepository } from './comments.query-repository';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dtos/updateComment.dto';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsRepository: CommentsQueryRepository,
    private readonly commentsService: CommentsService,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId') commentId: string,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    console.log('currentUserId', currentUserId);
    const commentFound = await this.commentsService.findCommentByIdWithReaction(
      commentId,
      currentUserId,
    );
    if (!commentFound) return res.sendStatus(404);
    return res.send(commentFound);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Delete(':commentId')
  async deleteCommentById(
    @Param('commentId') commentId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.commentsService.deleteCommentById(commentId, currentUserId);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':commentId')
  async updateCommentById(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.commentsService.updateCommentById(
      commentId,
      updateCommentDto.content,
      currentUserId,
    );
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':commentId/like-status')
  async reactToComment(
    @Param('commentId') commentId: string,
    @Body() likeStatusDto: LikeInputDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.commentsService.reactToComment(
      currentUserId,
      commentId,
      likeStatusDto.likeStatus,
    );
  }
}
