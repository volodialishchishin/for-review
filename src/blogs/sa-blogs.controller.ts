import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../users/guards/basic.auth.guard';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsService } from './blogs.service';
import { BanBlogDto } from './dtos/banBlog.dto';
import { BindToBlogDto } from './dtos/bindToBlog.dto';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';

@UseGuards(BasicAuthGuard)
@Controller('sa/blogs')
export class SuperUserBlogsPublicController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository, // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsService: BlogsService,
  ) {}

  @HttpCode(204)
  @Put(':blogId/bind-with-user/:userId')
  async bindBlogWithUser(@Param() bindData: BindToBlogDto) {
    await this.blogsService.bindBlogToUser(bindData.blogId, bindData.userId);
  }

  @Get()
  async findAllBlogsWithOwnerInfo(
    @Query() blogsPaginatorQuery: BlogsPaginator,
  ): Promise<BlogsPagination> {
    const blogs = await this.blogsQueryRepository.findAllBlogsWithOwnerInfo(
      blogsPaginatorQuery,
    );
    return blogs;
  }

  @HttpCode(204)
  @Put(':id/ban')
  async banBlog(@Param('id') blogId: string, @Body() banBlogDto: BanBlogDto) {
    await this.blogsService.banBlog(blogId, banBlogDto);
  }
}
