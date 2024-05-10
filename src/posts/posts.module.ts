import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { BlogsModule } from '../blogs/blogs.module';
import { CommentsModule } from '../comments/comments.module';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCheck.middleware';
import { UsersModule } from '../users/users.module';
import { JwtService } from '../utils/jwt.service';
import { PostsController } from './posts.controller';
import { PostsQueryRepository } from './posts.query-repository';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from './entities/blogpost.entity';
import { PostsReactions } from './entities/blogposts-reactions.entity';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PostsRepository, PostsQueryRepository, JwtService],
  imports: [
    forwardRef(() => BlogsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => CommentsModule),
    TypeOrmModule.forFeature([BlogPost, PostsReactions]),
  ],
  exports: [PostsQueryRepository, PostsRepository, PostsService],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .exclude(
        { path: 'posts', method: RequestMethod.POST },
        { path: 'posts/:id', method: RequestMethod.DELETE },
        { path: 'posts/:postId/comments', method: RequestMethod.POST },
        { path: 'posts/:postId/like-status', method: RequestMethod.PUT },
      )
      .forRoutes(PostsController);
  }
}
