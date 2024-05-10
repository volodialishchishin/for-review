import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { JwtService } from '../utils/jwt.service';
import { CommentsController } from './comments.controller';
import { CommentsQueryRepository } from './comments.query-repository';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCheck.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsReactions } from './entities/comments-reactions.entity';

@Module({
  imports: [
    forwardRef(() => PostsModule),
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([Comment, CommentsReactions]),
  ],
  exports: [CommentsService, CommentsRepository, CommentsQueryRepository],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,
    JwtService,
  ],
})
export class CommentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .forRoutes(CommentsController);
  }
}
