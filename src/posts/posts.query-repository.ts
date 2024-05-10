import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PostPaginator, PostsPagination } from './dtos/post-paginator';
import { PostDbModel } from './models/post-from-db.model';
import { PostViewModel } from './models/post-view.model';
import { BlogPost } from './entities/blogpost.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { PostsReactions } from './entities/blogposts-reactions.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(BlogPost) private postsTRepo: Repository<BlogPost>,
    @InjectRepository(PostsReactions)
    private postsReactionsTRepo: Repository<PostsReactions>,
  ) {}
  async findLatestCreatedPostByBlogId(blogId: string) {
    const query = `
      SELECT blogposts.id, title, "short_description", content, blogposts."created_at", "blog_id", blogs.name "blogName"
	    FROM public.blogposts
      LEFT JOIN blogs ON blogs.id="blog_id"
      WHERE "blog_id"=$1
      ORDER BY blogposts."created_at" DESC
      LIMIT 1;
      `;
    const result = await this.dataSource.query(query, [blogId]);
    const post: PostDbModel = result[0];
    console.log(post);
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async findAll(paginator: PostPaginator): Promise<PostDbModel[]> {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName", 
    (SELECT count(*) FROM public."postsReactions"
    WHERE "postId" = bp.id AND reaction = $3) as "likesCount",
    (SELECT count(*) FROM public."postsReactions"
    WHERE "postId" = bp.id AND reaction = $4) as "dislikesCount"
    FROM public.blogposts bp
    LEFT JOIN blogs ON blogs.id = bp."blogId"
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2 
    `;
    const values = [pageSize, skip, 'Like', 'Dislike'];
    const posts = await this.dataSource.query(query, values);

    return posts;
  }

  async countAllPosts(): Promise<number> {
    const totalCountQuery = `
    SELECT COUNT(id) FROM public.blogposts
    `;
    const result = await this.dataSource.query(totalCountQuery);
    return Number(result[0].count);
  }

  async countAllPostsForBlog(blogId: string): Promise<number> {
    const totalCountQuery = `
    SELECT COUNT(blogposts.id) FROM public.blogposts
    LEFT JOIN blogs ON blogs.id = blogposts."blog_id"
    WHERE blogs.id = $1
    `;
    const result = await this.dataSource.query(totalCountQuery, [blogId]);
    return Number(result[0].count);
  }

  async findAllPostsForBlog(blogId: string, paginator: PostPaginator) {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;

    // const qb = this.postsTRepo.createQueryBuilder('p');
    // const postsWithCount = await qb
    //   .select([
    //     'p.id',
    //     'p.title',
    //     'p.shortDescription',
    //     'p.content',
    //     'p.createdAt',
    //     'p.blogId',
    //     'blog.name',
    //     `(SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="user_id"
    //   WHERE "post_id" = p.id AND reaction = 'Like' AND users."isBanned" = FALSE) as likesCount`,
    //     `(SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="user_id"
    //   WHERE "post_id" = p.id AND reaction = 'Dislike' AND users."isBanned" = FALSE) as dislikesCount`,
    //   ])
    //   .leftJoin('p.blog', 'blog')
    //   .where('blog.id = :blogId ', { blogId })
    //   .orderBy(`p."${sortBy}"`, sortDirection)
    //   .limit(pageSize)
    //   .offset(skip)
    //   .getManyAndCount();

    // const postIds = postsWithCount[0].map((p) => p.id);
    // console.log(postIds);
    // const likesCount = await this.postsReactionsTRepo
    //   .createQueryBuilder('pr')
    //   .select('pr.postId')
    //   .addSelect('COUNT(*)', 'likesCount')
    //   .groupBy('pr.postId')
    //   .where(`pr.postId = ANY(:postIds) AND pr.reaction = 'Like'`, { postIds })
    //   .addSelect('COUNT(*)', 'dislikesCount')
    //   .addGroupBy('pr.postId')
    //   .where(`pr.postId = ANY(:postIds) AND pr.reaction = 'Dislike'`, {
    //     postIds,
    //   })
    //   .getRawMany();
    // console.log(likesCount);
    // return postsWithCount;
    // const reactions = await this.postsReactionsTRepo
    //   .createQueryBuilder('pr')
    //   .select(['pr.postId'])
    //   .addSelect('COUNT(*) as likesCount')
    //   .where()
    const query = `
    SELECT bp.id, title, bp."short_description", bp.content, bp."created_at", "blog_id", blogs."name" "blogName",
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="user_id"
    WHERE "post_id" = bp.id AND reaction = $4 AND users."isBanned" = $6) as "likesCount",
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="user_id"
    WHERE "post_id" = bp.id AND reaction = $5 AND users."isBanned" = $6) as "dislikesCount"
    FROM public.blogposts bp
    LEFT JOIN blogs ON blogs.id = bp."blog_id"
    WHERE blogs.id = $3
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2
    `;
    const values = [pageSize, skip, blogId, 'Like', 'Dislike', false];
    const posts = await this.dataSource.query(query, values);
    console.log(posts);
    return posts;
  }

  async findNewestLikes(postIds: string[]) {
    // console.log(postIds);
    const query = `
    SELECT * FROM (
      SELECT ROW_NUMBER() OVER (PARTITION BY "post_id" ORDER BY pr."createdAt" DESC) AS r,
      pr.*, u.login
      FROM "postsReactions" pr
      LEFT JOIN users u ON u.id = pr."user_id"
      WHERE "post_id" = ANY($1) AND reaction = $2 AND u."isBanned" = $3) x
      WHERE x.r <= 3
      ;
    `;
    // const query = `
    //   SELECT "userId", "postId", reaction, "createdAt"
    //   FROM public."postsReactions"
    //   WHERE (
    //     SELECT COUNT(*) FROM public."postsReactions"
    //     WHERE "postId" = ANY($1) AND reaction = $2
    //   )<=3
    //   ORDER BY "createdAt" DESC
    // `;
    const reactions = await this.dataSource.query(query, [
      postIds,
      'Like',
      false,
    ]);
    // console.log('reactions', reactions);
    return reactions.map((r: any) => {
      return {
        addedAt: r.createdAt,
        userId: r.userId,
        login: r.login,
        postId: r.postId,
      };
    });
  }

  async findPostById(postId: string): Promise<PostDbModel | undefined> {
    const query = `
    SELECT bp.id, title, bp.short_description, bp.content, bp.created_at, blog_id, blogs.name "blogName", 
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="user_id"
    WHERE "post_id" = bp.id AND reaction = $2 AND users."isBanned" = $4) as "likesCount",
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="user_id"
    WHERE "post_id" = bp.id AND reaction = $3 AND users."isBanned" = $4) as "dislikesCount"
    FROM public.blogposts bp 
    LEFT JOIN blogs ON blogs.id = bp."blog_id"
    WHERE bp.id = $1 
    `;
    const values = [postId, 'Like', 'Dislike', false];
    const post = await this.dataSource.query(query, values);
    return post[0];
  }

  toPostsViewModel(post: any) {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id,
      blogName: post.blogName,
      createdAt: post.created_at,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: '',
        newestLikes: [],
      },
    };
  }
}
