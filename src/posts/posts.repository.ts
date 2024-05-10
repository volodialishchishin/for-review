import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReactionUpdate } from '../comments/dtos/reactionUpdate.model';
import { Reaction } from '../reactions/reaction.model';
import { UpdatePostDto } from './dtos/updatePost.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findPostById(postId: string) {
    const query = `
    SELECT blogposts.id, title, short_description, content, blog_id, blogposts.created_at, blogs.name "blogName" FROM public.blogposts
    LEFT JOIN blogs ON blogs.id=blogposts.blog_id
    WHERE blogposts.id=$1
`;
    const result = await this.dataSource.query(query, [postId]);
    if (result.length === 0) return null;
    const post = result[0];
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

  async getUsersReactions(currentUserId: string, postIds: any[]) {
    const query = `
      SELECT * FROM public."postsReactions"
      WHERE "user_id"=$1 AND "post_id" = ANY($2)
    `;
    const res = await this.dataSource.query(query, [currentUserId, postIds]);
    return res;
  }

  async updatePostById(postId: string, dto: UpdatePostDto) {
    const query = `
    UPDATE public.blogposts
	  SET  title=$1, "shortDescription"=$2, content=$3
	  WHERE id=$4;
`;
    const result = await this.dataSource.query(query, [
      dto.title,
      dto.shortDescription,
      dto.content,
      postId,
    ]);
  }
  async deletePostById(postId: string) {
    const query = `
    DELETE FROM public.blogposts
    WHERE id=$1
`;
    await this.dataSource.query(query, [postId]);
  }

  async deleteAllPosts() {
    const query = `
    DELETE FROM public.blogposts
`;
    await this.dataSource.query(query);
  }

  async checkUserReactionForOnePost(
    postId: string,
    currentUserId: string,
  ): Promise<Reaction> {
    const query = `
      SELECT reaction FROM public."postsReactions"
      WHERE "postId"=$1 AND "userId"=$2
    `;

    const res = await this.dataSource.query(query, [postId, currentUserId]);
    if (res.length === 0) return 'None';
    return res[0].reaction;
  }
  // method no more needed, count likes and dislikes from reactions table
  // async updateReactionCount(commentId: string, reactionUpdate: ReactionUpdate) {
  //   const query = `
  //     UPDATE public.blogposts
  //     SET "likesCount" = "likesCount" + $1, "dislikesCount" = "dislikesCount" + $2
  //     WHERE id=$3;
  //   `;
  //   await this.dataSource.query(query, [
  //     reactionUpdate.likesCount,
  //     reactionUpdate.dislikesCount,
  //     commentId,
  //   ]);
  // }

  async updatePostReactions(
    postId: string,
    currentUserId: string,
    likeStatus: string,
  ): Promise<void> {
    const reactionQuery = `
      SELECT * FROM public."postsReactions"
      WHERE "postId"=$1 AND "userId"=$2
    `;
    const reactionRes = await this.dataSource.query(reactionQuery, [
      postId,
      currentUserId,
    ]);

    const insertQuery = `
      INSERT INTO public."postsReactions"(
	    "postId", "userId", reaction)
	    VALUES ($1, $2, $3);
    `;
    const updateQuery = `
      UPDATE public."postsReactions" pr
	    SET  reaction=$1
	    WHERE pr."postId"=$2 AND pr."userId"=$3;
    `;
    if (reactionRes.length === 0) {
      await this.dataSource.query(insertQuery, [
        postId,
        currentUserId,
        likeStatus,
      ]);
    } else {
      await this.dataSource.query(updateQuery, [
        likeStatus,
        reactionRes[0].postId,
        reactionRes[0].userId,
      ]);
    }
  }
}
