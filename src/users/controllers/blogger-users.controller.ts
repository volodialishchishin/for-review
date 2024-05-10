import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from '../../blogs/blogs.service';
import { CurrentUser } from '../../decorators/current-user-param.decorator';
import { BanUserByBloggerDto } from '../dtos/ban-user-by-blogger.dto';
import { BannedUsersPaginator } from '../dtos/banned-users-paginator';
import { UsersPagination } from '../dtos/paginator';
import { BearerAuthGuard } from '../guards/bearer.auth.guard';

@UseGuards(BearerAuthGuard)
@Controller('blogger/users')
export class BloggerUserController {
  constructor(
    private readonly blogsService: BlogsService,
  ) {}

  @Get('blog/:id')
  async findAllBannedUsers(
    @Param('id') blogId: string,
    @Query() paginator: BannedUsersPaginator,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UsersPagination> {
    const users = await this.blogsService.findAllBannedUsersForBlog(
      currentUserId,
      blogId,
      paginator,
    );
    return users;
  }

  @HttpCode(204)
  @Put(':id/ban')
  async banUnbanUserByBlogger(
    @Param('id') userId: string,
    @Body() banUserByBloggerDto: BanUserByBloggerDto,
    @CurrentUser('id') bloggerId: string,
  ) {
    await this.blogsService.banUserByBlogger(
      bloggerId,
      userId,
      banUserByBloggerDto,
    );
  }
}
