import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsRepository } from './blogs.repository';
import { CreateBlogDto } from './dtos/createBlog.dto';
import { UpdateBlogDto } from './dtos/updateBlogDto';
import isUUID from 'validator/lib/isUUID';
import { CreatePostDto } from '../posts/dtos/createPost.dto';
import { DataSource } from 'typeorm';
import { BannedUsersPaginator } from '../users/dtos/banned-users-paginator';
import { BanUserByBloggerDto } from '../users/dtos/ban-user-by-blogger.dto';
import { BanBlogDto } from './dtos/banBlog.dto';
import { UsersRepository } from '../users/repositories/users.repository';
import { UsersQueryRepository } from '../users/repositories/users.query-repository';

@Injectable()
export class BlogsService {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    protected dataSource: DataSource,
  ) {}
  async createNewBlog(
    blogDto: CreateBlogDto,
    currentUserId: string,
  ): Promise<string> {
    const blogId = await this.blogsRepository.createBlog(
      blogDto,
      currentUserId,
    );
    return blogId;
  }

  async updateBlog(
    currentUserId: string,
    blogId: string,
    updateBlogDto: UpdateBlogDto,
  ): Promise<void> {
    if (!isUUID(blogId)) throw new NotFoundException();
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();
    await this.blogsRepository.updateBlog(blogId, updateBlogDto);
  }

  async createBlogPost(
    blogId: string,
    createPostDto: CreatePostDto,
    currentUserId: string,
  ) {
    if (!isUUID(blogId)) throw new NotFoundException(); //TODO make with class validator
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();
    await this.blogsRepository.createPost(createPostDto, blogId);
  }

  async deleteBlogById(currentUserId: string, blogId: string) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();

    await this.blogsRepository.deleteBlogById(blogId);
  }
  async findAllBannedUsersForBlog(
    currentUserId: string,
    blogId: string,
    paginator: BannedUsersPaginator,
  ) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    console.log(blog);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();

    const users = await this.blogsRepository.findAllBannedUsers(
      blogId,
      paginator,
    );
    return users;
  }

  async banUserByBlogger(
    bloggerId: string,
    userId: string,
    banUserByBloggerDto: BanUserByBloggerDto,
  ) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(
      banUserByBloggerDto.blogId,
    );
    if (!blog)
      throw new BadRequestException({
        field: 'blogId',
        message: 'blog with this ID not found',
      });

    if (blog.ownerId !== bloggerId) throw new ForbiddenException();

    const user = await this.usersQueryRepository.findUserById(userId);
    if (!user) throw new NotFoundException();

    await this.blogsRepository.updateBanStatusOfUserInBlog(
      banUserByBloggerDto,
      userId,
    );
  }

  async banBlog(blogId: string, banBlogDto: BanBlogDto) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog)
      throw new BadRequestException({
        field: 'blogId',
        message: 'blog with such id does not exist',
      });
    await this.blogsRepository.setBanStatusToBlog(banBlogDto, blogId);
  }

  async bindBlogToUser(blogId: string, userId: string) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog || blog?.ownerId)
      throw new BadRequestException({
        message: 'Blog does not exist or is already bound',
        field: 'blodId',
      });

    const user = await this.usersQueryRepository.findUserById(userId);
    if (!user) {
      throw new BadRequestException({
        message: 'User with passed Id does not exist',
        field: 'userId',
      });
    }
    await this.blogsRepository.bindBlogToUser(userId, blogId);
  }

  async isBlogBanned(blogId: string) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog || !blog.isBanned) return false;
    return true;
  }

  async isUserBannedForCurrentBlog(
    blogId: string,
    userId: string,
  ): Promise<boolean> {
    const bannedUser = await this.usersRepository.findBannedUserForBlog(
      blogId,
      userId,
    );
    if (!bannedUser) return false;
    return bannedUser.isBanned;
  }
}
