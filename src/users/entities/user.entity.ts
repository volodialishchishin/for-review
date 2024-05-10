import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from './session.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { UserRegisterConfirmation } from './user-register-confirmation.entity';
import { UserPasswordRecovery } from './user-pass-recovery.entity';
import { BannedUsersForBlogs } from '../../blogs/entities/banned-users-for-blog.entity';
import { PostsReactions } from '../../posts/entities/blogposts-reactions.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  login: string;

  @Column()
  passwordHash: string;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;
  @Column({ type: 'timestamp without time zone', nullable: true })
  banDate: Date | null;
  @Column({ type: 'character varying', nullable: true })
  banReason: string | null;

  @OneToMany(() => Session, (s) => s.user)
  sessions: Session[];

  @OneToMany(() => Comment, (c) => c.commentator, { onDelete: 'CASCADE' })
  comments: Comment[];

  @OneToMany(() => BannedUsersForBlogs, (b) => b.user, {
    onDelete: 'CASCADE',
  })
  bans: BannedUsersForBlogs[];

  @OneToMany(() => PostsReactions, (r) => r.userId, {
    onDelete: 'CASCADE',
  })
  reactions: PostsReactions[];

  @OneToMany(() => Blog, (b) => b.owner)
  blogs: Blog[];

  @OneToOne(() => UserRegisterConfirmation, (c) => c.user) // specify inverse side as a second parameter
  confirmation: UserRegisterConfirmation;

  @OneToOne(() => UserPasswordRecovery, (c) => c.user) // specify inverse side as a second parameter
  passRecovery: UserRegisterConfirmation;
}
