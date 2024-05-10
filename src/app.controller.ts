import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { BlogsRepository } from './blogs/blogs.repository';
import { PostsRepository } from './posts/posts.repository';
import { UsersRepository } from './users/repositories/users.repository';
import { CommentsRepository } from './comments/comments.repository';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersRepository: UsersRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @HttpCode(204)
  @Delete('testing/all-data')
  async deleteAllData() {
    await this.blogsRepository.deleteAllBlogs();
    await this.postsRepository.deleteAllPosts();
    await this.commentsRepository.deleteAllComments();
    await this.usersRepository.deleteAllUsers();
    await this.usersRepository.deleteAllSessions();
  }

  @HttpCode(204)
  @Delete('testing/all-blogs')
  async deleteAllBlogs() {
    await this.blogsRepository.deleteAllBlogs();
  }

  @HttpCode(204)
  @Delete('testing/all-posts')
  async deleteAllPosts() {
    await this.postsRepository.deleteAllPosts();
  }

  @HttpCode(204)
  @Delete('testing/all-comments')
  async deleteAllComments() {
    await this.commentsRepository.deleteAllComments();
  }

  @HttpCode(204)
  @Delete('testing/all-users')
  async deleteAllUsers() {
    await this.usersRepository.deleteAllUsers();
  }
}
