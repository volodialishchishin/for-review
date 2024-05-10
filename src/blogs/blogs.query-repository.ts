import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';
import { Blog } from './entities/blog.entity';
import { SaBlogViewModel } from './models/sa-blog-view.model';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog) private blogsTRepo: Repository<Blog>,
  ) {}

  async findAllBlogs(paginator: BlogsPaginator): Promise<BlogsPagination> {
    const searchNameTerm = paginator.searchNameTerm
      ? '%' + paginator.searchNameTerm + '%'
      : '%';
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const [blogs, totalCount] = await this.blogsTRepo
      .createQueryBuilder('b')
      .select([
        'b.id',
        'b.name',
        'b.description',
        'b.websiteUrl',
        'b.createdAt',
        'b.isMembership',
      ])
      .where(
        `LOWER(b.name) LIKE LOWER(:searchNameTerm) AND 
          b.isBanned = :isBanned`,
        {
          searchNameTerm: `%${searchNameTerm}%`,
          isBanned: false,
        },
      )
      .orderBy(`b."${sortBy}"`, sortDirection)
      .limit(pageSize)
      .offset(skip)
      .getManyAndCount();
    // const query = `
    // SELECT id, name, "description", "website_url", "created_at", "is_membership" FROM public.blogs
    // WHERE LOWER(name) LIKE LOWER($1) AND blogs."is_banned"=$4
    // ORDER BY "${sortBy}" ${sortDirection}
    // LIMIT $2 OFFSET $3
    // `;
    // const values = [searchNameTerm, pageSize, skip, false];
    // const blogs: PublicBlogViewModel[] = await this.dataSource.query(
    //   query,
    //   values,
    // );

    // const totalCountQuery = `
    // SELECT COUNT(id) FROM public.blogs
    // WHERE LOWER(name) LIKE LOWER($1)
    // `;
    // const result = await this.dataSource.query(totalCountQuery, [
    //   searchNameTerm,
    // ]);
    // const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: blogs,
    };
  }

  async findAllBlogsWithOwnerInfo(blogsPaginatorQuery: BlogsPaginator) {
    const searchNameTerm = blogsPaginatorQuery.searchNameTerm
      ? '%' + blogsPaginatorQuery.searchNameTerm + '%'
      : '%';
    const sortBy = blogsPaginatorQuery.sortBy;
    const sortDirection = blogsPaginatorQuery.sortDirection;
    const pageSize = blogsPaginatorQuery.pageSize;
    const skip =
      (blogsPaginatorQuery.pageNumber - 1) * blogsPaginatorQuery.pageSize;
    const query = `
    SELECT blogs.id, name, "description", "website_url", blogs."created_at", "is_membership", users.id "userId",
    users.login "userLogin", blogs."is_banned", blogs."ban_date" FROM public.blogs
    LEFT JOIN users ON users.id=blogs."owner_id"
    WHERE LOWER(name) LIKE LOWER($1) 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $2 OFFSET $3 
    `;
    const values = [searchNameTerm, pageSize, skip];
    const blogs = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(*) FROM public.blogs
    LEFT JOIN users ON users.id=blogs."owner_id"
    WHERE LOWER(name) LIKE LOWER($1) 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchNameTerm,
    ]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / blogsPaginatorQuery.pageSize);
    return {
      pagesCount,
      page: blogsPaginatorQuery.pageNumber,
      pageSize: blogsPaginatorQuery.pageSize,
      totalCount,
      items: blogs.map(this.toSaBlogViewModel),
    };
  }

  toSaBlogViewModel(b: any): SaBlogViewModel {
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      websiteUrl: b.websiteUrl,
      createdAt: b.createdAt,
      isMembership: b.isMembership,
      blogOwnerInfo: {
        userId: b.userId,
        userLogin: b.userLogin,
      },
      banInfo: {
        isBanned: b.isBanned,
        banDate: b.banDate,
      },
    };
  }

  async findNotBannedBlogById(id: string): Promise<Partial<Blog> | null> {
    const blog = await this.blogsTRepo.findOne({
      select: {
        id: true,
        name: true,
        description: true,
        websiteUrl: true,
        createdAt: true,
        isMembership: true,
      },
      where: {
        id,
        isBanned: false,
      },
    });
    // const query = `
    // SELECT id, name, "description", "website_url", "created_at", "is_membership" FROM public.blogs
    // WHERE id=$1 AND "is_banned"=$2
    // `;
    // const result = await this.dataSource.query(query, [id, false]);
    // return result[0];
    return blog;
  }

  async findBlogById(newBlogId: string): Promise<Partial<Blog>> {
    const query = `
    SELECT id, name, "description", "website_url", "created_at", "is_membership" FROM public.blogs
    WHERE id=$1 and "is_banned"=$2
    `;
    const result = await this.dataSource.query(query, [newBlogId, false]);
    return result[0];
  }

  async findLatestCreatedBlog(userId: string): Promise<Partial<Blog>> {
    const query = `
    SELECT id, name, "description", "website_url", "created_at", "is_membership" FROM public.blogs
    WHERE "owner_id"=$1
    ORDER BY "created_at" DESC
    LIMIT 1
    `;
    const result = await this.dataSource.query(query, [userId]);
    return result[0];
  }

  async findAllBlogsForCurrentUser(
    blogsPaginatorQuery: BlogsPaginator,
    currentUserId: string,
  ): Promise<BlogsPagination> {
    const searchNameTerm = blogsPaginatorQuery.searchNameTerm
      ? '%' + blogsPaginatorQuery.searchNameTerm + '%'
      : '%';
    const sortBy = blogsPaginatorQuery.sortBy;
    const sortDirection = blogsPaginatorQuery.sortDirection;
    const pageSize = blogsPaginatorQuery.pageSize;
    const skip =
      (blogsPaginatorQuery.pageNumber - 1) * blogsPaginatorQuery.pageSize;
    const query = `
    SELECT id, name, description, website_url, created_at, is_membership FROM public.blogs
    WHERE LOWER(name) LIKE LOWER($1) AND "is_banned" = $2 AND "owner_id"=$5 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $3 OFFSET $4 
    `;
    const values = [searchNameTerm, false, pageSize, skip, currentUserId];
    const users = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(id) FROM public.blogs
    WHERE LOWER(name) LIKE LOWER($1) AND "is_banned" = $2 AND "owner_id"=$3 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchNameTerm,
      false,
      currentUserId,
    ]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / blogsPaginatorQuery.pageSize);
    return {
      pagesCount,
      page: blogsPaginatorQuery.pageNumber,
      pageSize: blogsPaginatorQuery.pageSize,
      totalCount,
      items: users,
    };
  }
}
