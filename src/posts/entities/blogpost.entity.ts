import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { PostsReactions } from './blogposts-reactions.entity';

@Entity('blogposts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'short_description' })
  shortDescription: string;

  @Column()
  content: string;

  @Column({ name: 'blog_id' })
  blogId: string;

  @ManyToOne(() => Blog, (b) => b.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];

  @OneToMany(() => PostsReactions, (r) => r.postId)
  reactions: PostsReactions[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
