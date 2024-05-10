import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentsPaginator } from './dtos/comment-paginator.dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findCommentById(commentId: string) {}

  async findAllCommentsForPosts(
    currentUserId: string,
    paginator: CommentsPaginator,
  ) {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT c.id, c."postId", c.content, c."commentatorId" "userId", u.login "userLogin", c."createdAt", p.title, p."blogId" , b.name "blogName"
    FROM public.comments c
    LEFT JOIN blogposts p ON c."postId" = p.id
    LEFT JOIN users u ON c."commentatorId" = u.id
    LEFT JOIN blogs b ON p."blogId" = b.id
    WHERE b."isBanned" = $1
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $2 OFFSET $3 
    `;
    const values = [false, pageSize, skip];
    const comments = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(c.id) FROM public.comments c
    LEFT JOIN blogposts p ON c."postId" = p.id
    LEFT JOIN users u ON c."commentatorId" = u.id
    LEFT JOIN blogs b ON p."blogId" = b.id
    WHERE b."isBanned" = $1
    `;
    const result = await this.dataSource.query(totalCountQuery, [false]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: comments.map(this.toCommentsViewModel),
    };
  }
  toCommentsViewModel(comment: any) {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
      postInfo: {
        id: comment.postId,
        title: comment.title,
        blogId: comment.blogId,
        blogName: comment.blogName,
      },
    };
  }
}
