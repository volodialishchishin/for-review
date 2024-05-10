import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BlogsModule } from './blogs/blogs.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // url: `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}`,
      host: process.env.PGHOST || 'localhost',
      port: 5432,
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'sa',
      database: process.env.PGDATABASE || 'typeorm', //'nest-db',
      ssl: Boolean(process.env.PGSSL) || false,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    UsersModule,
    BlogsModule,
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
//
