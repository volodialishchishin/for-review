import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BlogPost } from './blogpost.entity';
import { User } from '../../users/entities/user.entity';
import { Reaction } from '../../reactions/reaction.model';

@Entity('postsReactions')
export class PostsReactions {
  @PrimaryColumn({ name: 'post_id' })
  postId: string;
  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: BlogPost;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'None' })
  reaction: Reaction;

  @CreateDateColumn()
  createdAt: Date;
}
