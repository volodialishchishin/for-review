import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';
import { PostPaginator } from '../posts/dtos/post-paginator';
import { PostsService } from '../posts/posts.service';
import { CurrentUser } from '../decorators/current-user-param.decorator';

@Controller('blogs')
export class BlogsPublicController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository, // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService, // private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogsPaginator,
  ): Promise<BlogsPagination> {
    const blogs = await this.blogsQueryRepository.findAllBlogs(
      blogsPaginatorQuery,
    );
    return blogs;
  }

  @Get(':id')
  async findBlogById(@Param('id') id: string, @Res() res: Response) {
    const blogFound = await this.blogsQueryRepository.findNotBannedBlogById(id);
    if (!blogFound) return res.sendStatus(404);
    return res.status(200).send(blogFound);
  }

  @Get(':blogId/posts')
  async getAllPostForBlog(
    @Param('blogId') blogId: string,
    @Query() paginator: PostPaginator,
    @CurrentUser('id') currentUserId: string,
  ) {
    const posts = await this.postsService.findAllPostsForBlog(
      blogId,
      paginator,
      currentUserId,
    );
    return posts;
  }
}
