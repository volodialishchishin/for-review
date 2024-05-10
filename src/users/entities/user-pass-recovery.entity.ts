import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_pass_recovery')
export class UserPasswordRecovery {
  @OneToOne(() => User, (user) => user.passRecovery, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: string;

  @PrimaryColumn()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  recoveryCode: string;
  @Column({ nullable: true })
  codeExpDate: Date;
  @Column({ default: false })
  codeIsUsed: boolean;
}
