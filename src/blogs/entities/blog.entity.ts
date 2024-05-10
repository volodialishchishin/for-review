import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../posts/entities/blogpost.entity';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'website_url' })
  websiteUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'is_membership', default: false })
  isMembership: boolean;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string;

  @ManyToOne(() => User, (u) => u.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => BlogPost, (bp) => bp.blog)
  posts: BlogPost[];

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @Column({ name: 'ban_date', nullable: true })
  banDate: Date;
}
