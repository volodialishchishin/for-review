import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { BlogsRepository } from '../blogs/blogs.repository';
import { ReactionUpdate } from '../comments/dtos/reactionUpdate.model';
import { Reaction } from '../reactions/reaction.model';
import { UpdatePostDto } from './dtos/updatePost.dto';
import { PostsRepository } from './posts.repository';
import { PostPaginator, PostsPagination } from './dtos/post-paginator';
import { PostsQueryRepository } from './posts.query-repository';
import { PostDbModel } from './models/post-from-db.model';
import { PostViewModel } from './models/post-view.model';

@Injectable()
export class PostsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}
  async updatePostById(
    blogId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
    currentUserId: string,
  ) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    const post = await this.postsRepository.findPostById(postId);
    if (!blog || !post) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();

    if (post.blogId.toString() !== blogId)
      throw new BadRequestException({
        message: 'Wrong blogId',
        field: 'blogId',
      });
    await this.postsRepository.updatePostById(postId, updatePostDto);
  }

  async findAllPosts(currentUserId: string, paginator: PostPaginator) {
    const posts = await this.postsQueryRepository.findAll(paginator);
    if (posts.length === 0) throw new NotFoundException();
    const totalCount = await this.postsQueryRepository.countAllPosts();
    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    const postIds = posts.map((p: any) => p.id);
    const newestLikes = await this.postsQueryRepository.findNewestLikes(
      postIds,
    );
    let usersReactions = null;
    if (currentUserId) {
      usersReactions = await this.postsRepository.getUsersReactions(
        currentUserId,
        postIds,
      );
    }
    console.log(usersReactions);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: this.toPostsViewModel(posts, usersReactions, newestLikes),
    };
  }

  async findPostById(postId: string, currentUserId: string) {
    const post = await this.postsQueryRepository.findPostById(postId);
    if (!post) throw new NotFoundException();

    const newestLikes = await this.postsQueryRepository.findNewestLikes([
      post.id,
    ]);
    let usersReactions = null;
    if (currentUserId) {
      usersReactions = await this.postsRepository.getUsersReactions(
        currentUserId,
        [post.id],
      );
    }
    return this.toPostsViewModel([post], usersReactions, newestLikes)[0];
  }

  async findAllPostsForBlog(
    blogId: string,
    paginator: PostPaginator,
    currentUserId: string | null,
  ): Promise<PostsPagination> {
    const posts = await this.postsQueryRepository.findAllPostsForBlog(
      blogId,
      paginator,
    );
    // console.log(posts);
    if (posts.length === 0) throw new NotFoundException();
    const totalCount = await this.postsQueryRepository.countAllPostsForBlog(
      blogId,
    );
    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    const postIds = posts.map((p: any) => p.id);
    const newestLikes = await this.postsQueryRepository.findNewestLikes(
      postIds,
    );
    let usersReactions = null;
    if (currentUserId) {
      usersReactions = await this.postsRepository.getUsersReactions(
        currentUserId,
        postIds,
      );
    }
    // console.log('react', usersReactions);
    // console.log('posts', posts);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      // items: posts,
      items: this.toPostsViewModel(posts, usersReactions, newestLikes),
    };
  }

  private toPostsViewModel(
    posts: PostDbModel[],
    usersReactions: any,
    newestLikes: any,
  ) {
    return posts.map((post: any) => {
      return {
        id: post.id,
        title: post.title,
        shortDescription: post.short_description,
        content: post.content,
        blogId: post.blog_id,
        blogName: post.blogName,
        createdAt: post.created_at,
        extendedLikesInfo: {
          likesCount: Number(post.likesCount),
          dislikesCount: Number(post.dislikesCount),
          myStatus:
            usersReactions?.find((r: any) => r.postId === post.id)?.reaction ||
            'None',
          newestLikes:
            newestLikes
              ?.filter((l: any) => l.postId === post.id)
              .map((l: any) => {
                delete l['postId'];
                return l;
              }) || [],
        },
      };
    });
  }

  async deletePostById(blogId: string, postId: string, currentUserId: string) {
    if (!isUUID(blogId)) throw new NotFoundException();
    if (!isUUID(postId)) throw new NotFoundException();
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    const post = await this.postsRepository.findPostById(postId);
    if (!blog || !post) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();
    await this.postsRepository.deletePostById(postId);
  }

  async reactToPost(
    currentUserId: string,
    postId: string,
    likeStatus: Reaction,
  ) {
    if (!isUUID(postId)) throw new NotFoundException();
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException();

    const currentReaction =
      await this.postsRepository.checkUserReactionForOnePost(
        postId,
        currentUserId,
      );
    if (currentReaction === likeStatus) return;

    // let reactionUpdate: ReactionUpdate;
    // if (likeStatus === 'None') {
    //   if (currentReaction === 'Like') {
    //     reactionUpdate = {
    //       likesCount: -1,
    //       dislikesCount: 0,
    //     };
    //   } else {
    //     // currentReaction = 'Dislike'
    //     reactionUpdate = {
    //       likesCount: 0,
    //       dislikesCount: -1,
    //     };
    //   }
    // } else {
    //   if (currentReaction === 'None') {
    //     reactionUpdate = {
    //       likesCount: likeStatus === 'Like' ? 1 : 0,
    //       dislikesCount: likeStatus === 'Like' ? 0 : 1,
    //     };
    //   } else if (currentReaction === 'Like') {
    //     reactionUpdate = {
    //       likesCount: likeStatus === 'Like' ? 0 : -1,
    //       dislikesCount: likeStatus === 'Like' ? 0 : 1,
    //     };
    //   } else {
    //     // currentReaction = 'Dislike'
    //     reactionUpdate = {
    //       likesCount: likeStatus === 'Like' ? 1 : 0,
    //       dislikesCount: likeStatus === 'Like' ? -1 : 0,
    //     };
    //   }
    // }
    await this.postsRepository.updatePostReactions(
      postId,
      currentUserId,
      likeStatus,
    );
  }
}
