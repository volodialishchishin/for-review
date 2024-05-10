import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Reaction } from '../../reactions/reaction.model';
import { Comment } from './comment.entity';

@Entity('commentsReactions')
export class CommentsReactions {
  @PrimaryColumn({ name: 'comment_id' })
  commentId: string;
  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'None' })
  reaction: Reaction;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
