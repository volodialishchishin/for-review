import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_register_confirmation')
export class UserRegisterConfirmation {
  @OneToOne(() => User, (user) => user.confirmation, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: string;

  @PrimaryColumn()
  userId: string;

  @Column()
  @Generated('uuid')
  code: string;
  @Column({ default: () => "now() + '01:00:00'::interval" })
  codeExpirationDate: Date;
  @Column({ default: false })
  codeIsConfirmed: boolean;
}
