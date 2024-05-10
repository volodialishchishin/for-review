import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ip: string;

  @Column()
  title: string;

  @Column()
  lastActiveDate: Date;

  @Column()
  deviceId: string;

  @Column()
  tokenExpireDate: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: 'CASCADE' })
  user: User;
}
