import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user-param.decorator';
import { CreatePostDto } from '../posts/dtos/createPost.dto';
import { UpdatePostDto } from '../posts/dtos/updatePost.dto';
import { PostsQueryRepository } from '../posts/posts.query-repository';
import { PostsService } from '../posts/posts.service';
import { BearerAuthGuard } from '../users/guards/bearer.auth.guard';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsService } from './blogs.service';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';
import { CreateBlogDto } from './dtos/createBlog.dto';
import { UpdateBlogDto } from './dtos/updateBlogDto';
import { Blog } from './entities/blog.entity';
import { CommentsPaginator } from '../comments/dtos/comment-paginator.dto';
import { CommentsQueryRepository } from '../comments/comments.query-repository';
import { CommentsService } from '../comments/comments.service';

@UseGuards(BearerAuthGuard)
@Controller('blogger/blogs')
export class BlogsBloggerController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsService: BlogsService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  async createBlog(
    @Body() blogDto: CreateBlogDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<Partial<Blog>> {
    await this.blogsService.createNewBlog(blogDto, currentUserId);
    return this.blogsQueryRepository.findLatestCreatedBlog(currentUserId);
  }

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogsPaginator,
    @CurrentUser('id') currentUserId: string,
  ): Promise<BlogsPagination> {
    const blogs = await this.blogsQueryRepository.findAllBlogsForCurrentUser(
      blogsPaginatorQuery,
      currentUserId,
    );
    return blogs;
  }

  @HttpCode(204)
  @Put(':id')
  async updateBlog(
    @Param('id') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.blogsService.updateBlog(currentUserId, blogId, updateBlogDto);
  }

  @HttpCode(201)
  @Post(':blogId/posts')
  async createBlogPost(
    @Param('blogId') blogId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    const postId = await this.blogsService.createBlogPost(
      blogId,
      createPostDto,
      currentUserId,
    );
    const post = await this.postsQueryRepository.findLatestCreatedPostByBlogId(
      blogId,
    );
    return post;
  }

  @HttpCode(204)
  @Put(':blogId/posts/:postId')
  async updatePostById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    await this.postsService.updatePostById(
      blogId,
      postId,
      updatePostDto,
      currentUserId,
    );
  }

  @HttpCode(204)
  @Delete(':blogId')
  async deleteBlogById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
  ) {
    await this.blogsService.deleteBlogById(currentUserId, blogId);
  }

  @HttpCode(204)
  @Delete(':blogId/posts/:postId')
  async deletePostById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    await this.postsService.deletePostById(blogId, postId, currentUserId);
  }

  @Get('comments')
  async getAllCommentsForAllPostsOfCurrentUser(
    @Query() paginator: CommentsPaginator,
    @CurrentUser('id') currentUserId: string,
  ) {
    const comments =
      await this.commentsService.findAllCommentsForNotBannedBlogs(
        currentUserId,
        paginator,
      );
    return comments;
  }
}
