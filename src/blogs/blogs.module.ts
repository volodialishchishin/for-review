import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { JwtService } from '../utils/jwt.service';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { BlogsBloggerController } from './blogger-blogs.controller';
import { BlogsPublicController } from './blogs.controller';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';
import { SuperUserBlogsPublicController } from './sa-blogs.controller';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCheck.middleware';
import { CommentsModule } from '../comments/comments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { BannedUsersForBlogs } from './entities/banned-users-for-blog.entity';
import { BlogPost } from '../posts/entities/blogpost.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PostsModule,
    CommentsModule,
    TypeOrmModule.forFeature([Blog, BannedUsersForBlogs, BlogPost]),
  ],
  exports: [BlogsRepository, BlogsQueryRepository, BlogsService],
  controllers: [
    BlogsPublicController,
    BlogsBloggerController,
    SuperUserBlogsPublicController,
  ],
  providers: [BlogsService, BlogsRepository, BlogsQueryRepository, JwtService],
})
export class BlogsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .forRoutes(BlogsPublicController);
  }
}
