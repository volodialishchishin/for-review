import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from '../posts/dtos/createPost.dto';
import { BanUserByBloggerDto } from '../users/dtos/ban-user-by-blogger.dto';
import { BannedUsersPaginator } from '../users/dtos/banned-users-paginator';
import { DataSource, Repository } from 'typeorm';
import { BanBlogDto } from './dtos/banBlog.dto';
import { CreateBlogDto } from './dtos/createBlog.dto';
import { UpdateBlogDto } from './dtos/updateBlogDto';
import { Blog } from './entities/blog.entity';
import { User } from '../users/entities/user.entity';
import { privateDecrypt } from 'crypto';
import { BlogPost } from '../posts/entities/blogpost.entity';
import { BannedUsersForBlogs } from './entities/banned-users-for-blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog) private blogsTRepo: Repository<Blog>,
    @InjectRepository(BlogPost) private postsTRepo: Repository<BlogPost>,
    @InjectRepository(BannedUsersForBlogs)
    private bannedUsersForBlogTRepo: Repository<BannedUsersForBlogs>,
  ) {}
  async createBlog(
    blogDto: CreateBlogDto,
    currentUserId: string,
  ): Promise<Blog['id']> {
    // const createQuery = `
    //   INSERT INTO public.blogs(name, description, website_url, owner_id)
    //     VALUES ($1, $2, $3, $4)
    //   `;

    // const result = await this.dataSource.query(createQuery, [
    //   blogDto.name,
    //   blogDto.description,
    //   blogDto.websiteUrl,
    //   currentUserId,
    // ]);
    const blog = this.blogsTRepo.create({ ...blogDto, ownerId: currentUserId });
    await this.blogsTRepo.save(blog);
    return blog.id;
  }

  async updateBlog(blogId: string, updateBlogDto: UpdateBlogDto) {
    // const updateQuery = `
    //   UPDATE public.blogs
    //     SET "name"=$1, "description"=$2, "website_url"=$3
    //     WHERE id = $4;
    // `;
    // await this.dataSource.query(updateQuery, [
    //   updateBlogDto.name,
    //   updateBlogDto.description,
    //   updateBlogDto.websiteUrl,
    //   blogId,
    // ]);
    await this.blogsTRepo.update({ id: blogId }, updateBlogDto);
  }

  async findBlogWithOwnerById(blogId: string): Promise<Partial<Blog> | null> {
    // const query = `
    // SELECT id, name, "description", "website_url", "created_at", "is_membership", "owner_id", "is_banned" FROM public.blogs
    // WHERE id=$1
    // `;
    // const result = await this.dataSource.query(query, [blogId]);
    // return result[0];
    const blog = await this.blogsTRepo.findOneBy({ id: blogId });
    return blog;
  }

  async findAllBannedUsers(blogId: string, paginator: BannedUsersPaginator) {
    const searchLoginTerm = paginator.searchLoginTerm
      ? '%' + paginator.searchLoginTerm + '%'
      : '%';
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const [users, totalCount] = await this.bannedUsersForBlogTRepo
      .createQueryBuilder('b')
      .select([
        'users.id',
        'users.login',
        'users.createdAt',
        'b.isBanned',
        'b.banDate',
        'b.banReason',
      ])
      .leftJoin(User, 'users', 'users.id = b.userId')
      .where(
        `LOWER(users.login) LIKE LOWER(:searchLoginTerm) AND 
          b.blogId = :blogId AND 
          b.isBanned = :isBanned`,
        {
          searchLoginTerm: `%${searchLoginTerm}%`,
          blogId,
          isBanned: true,
        },
      )
      .orderBy(`users."${sortBy}"`, sortDirection)
      .limit(pageSize)
      .offset(skip)
      .getManyAndCount();

    // const query = `
    // SELECT users.id, users."login", banned_users_for_blogs."isBanned", banned_users_for_blogs."banDate",
    // banned_users_for_blogs."banReason" FROM public.banned_users_for_blogs
    // LEFT JOIN users ON users.id = banned_users_for_blogs."userId"
    // WHERE LOWER(users."login") LIKE LOWER($1) AND "blogId" = $2 AND banned_users_for_blogs."isBanned"=$3
    // ORDER BY "${sortBy}" ${sortDirection}
    // LIMIT $4 OFFSET $5
    // `;
    // const values = [searchLoginTerm, blogId, true, pageSize, skip];
    // const users = await this.dataSource.query(query, values);

    // const totalCountQuery = `
    // SELECT users.id, users."login", banned_users_for_blogs."isBanned", banned_users_for_blogs."banDate", banned_users_for_blogs."banReason" FROM public.banned_users_for_blogs
    // LEFT JOIN users ON users.id = banned_users_for_blogs."userId"
    // WHERE LOWER(users."login") LIKE LOWER($1) AND "blogId" = $2 AND banned_users_for_blogs."isBanned"=$3
    // `;
    // const result = await this.dataSource.query(totalCountQuery, [
    //   searchLoginTerm,
    //   blogId,
    //   true,
    // ]);
    // const totalCount = Number(result.length);

    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: users.map((u: any) => ({
        id: u.id,
        login: u.login,
        banInfo: {
          isBanned: u.isBanned,
          banDate: u.banDate,
          banReason: u.banReason,
        },
      })),
    };
  }

  async createPost(createPostDto: CreatePostDto, blogId: string) {
    // const query = `
    // INSERT INTO public.blogposts(title, "shortDescription", content, "blogId")
    //   VALUES ($1, $2, $3, $4)
    // `;
    // await this.dataSource.query(query, [
    //   createPostDto.title,
    //   createPostDto.shortDescription,
    //   createPostDto.content,
    //   blogId,
    // ]);
    const post = this.postsTRepo.create({ blogId, ...createPostDto });
    await this.postsTRepo.save(post);
  }

  async deleteBlogById(blogId: string) {
    //     const query = `
    //     DELETE FROM public.blogs
    // 	  WHERE id=$1;
    // `;
    //     await this.dataSource.query(query, [blogId]);
    await this.blogsTRepo.delete({ id: blogId });
  }

  async updateBanStatusOfUserInBlog(
    banUserByBloggerDto: BanUserByBloggerDto,
    userId: string,
  ) {
    const query = `
    SELECT id FROM public.banned_users_for_blogs
    WHERE "userId"=$1
`;
    const unbanUserQuery = `
    UPDATE public.banned_users_for_blogs
	  SET "isBanned"=$1, "banReason"=null, "banDate"=null
	  WHERE "userId"=$2 AND "blogId"=$3; 
`;

    const banExistingUserQuery = `
    UPDATE public.banned_users_for_blogs
	  SET "isBanned"=$1, "banReason"=$2, "banDate"=now()
	  WHERE "userId"=$3 AND "blogId"=$4; 
`;

    const banNewUserQuery = `
    INSERT INTO public.banned_users_for_blogs(
	"userId", "blogId", "isBanned", "banReason")
	VALUES ($1, $2, $3, $4);
`;
    const userInBanList = await this.dataSource.query(query, [userId]);

    if (!banUserByBloggerDto.isBanned) {
      if (userInBanList.length !== 1) return;
      await this.dataSource.query(unbanUserQuery, [
        false,
        userId,
        banUserByBloggerDto.blogId,
      ]);
      return;
    }
    if (userInBanList.length === 1) {
      await this.dataSource.query(banExistingUserQuery, [
        true,
        banUserByBloggerDto.banReason,
        userId,
        banUserByBloggerDto.blogId,
      ]);
    } else {
      await this.dataSource.query(banNewUserQuery, [
        userId,
        banUserByBloggerDto.blogId,
        true,
        banUserByBloggerDto.banReason,
      ]);
    }
  }

  async setBanStatusToBlog(banBlogDto: BanBlogDto, blogId: string) {
    const isBanned = banBlogDto.isBanned;
    const banDate = isBanned ? new Date() : null;
    const query = `
    UPDATE public.blogs
	  SET "is_banned"=$1, "ban_date"=$2
	  WHERE id=$3;
`;
    await this.dataSource.query(query, [isBanned, banDate, blogId]);
  }

  async bindBlogToUser(userId: string, blogId: string) {
    const query = `
    UPDATE public.blogs
	  SET "owner_id"=$1
	  WHERE id=$2;
`;
    await this.dataSource.query(query, [userId, blogId]);
  }

  async deleteAllBlogs() {
    const query = `
    DELETE FROM public.blogs
`;
    await this.dataSource.query(query);
  }
}
