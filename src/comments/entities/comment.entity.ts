import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reaction } from '../../reactions/reaction.model';
import { BlogPost } from '../../posts/entities/blogpost.entity';
import { User } from '../../users/entities/user.entity';
import { CommentsReactions } from './comments-reactions.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: false })
  postId: string;
  @ManyToOne(() => BlogPost, (bp) => bp.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: BlogPost;

  @Column()
  content: string;

  @Column({ name: 'commentator_id', type: 'uuid', nullable: false })
  commentatorId: string;
  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentator_id' })
  commentator: User;

  @OneToMany(() => CommentsReactions, (r) => r.comment)
  reactions: CommentsReactions[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

export interface CommentViewModel extends Comment {
  commentatorLogin: string;
  myStatus: Reaction;
  likesCount: number;
  dislikesCount: number;
}

export interface CommentViewModelWithPostInfo extends CommentViewModel {
  postId: string;
  title: string;
  blogId: string;
  blogName: string;
}
// comment
