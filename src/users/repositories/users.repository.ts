import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { User } from '../entities/user.entity';
import { SessionsRepository } from './sessions.repository';
import { UserRegisterConfirmation } from '../entities/user-register-confirmation.entity';
import { UserPasswordRecovery } from '../entities/user-pass-recovery.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    private readonly sessionsRepository: SessionsRepository,
    @InjectRepository(UserRegisterConfirmation)
    private readonly regConfirmationRepo: Repository<UserRegisterConfirmation>,
    @InjectRepository(UserPasswordRecovery)
    private readonly passRecoveryRepo: Repository<UserPasswordRecovery>,
    @InjectRepository(User) private readonly usersTRepo: Repository<User>,
  ) {}

  // async findUserByLoginOrEmail(login: string, email: string): Promise<User> {
  //   const query = `
  //   SELECT * FROM public.users
  //   WHERE login = $1 OR email = $2
  //   `;

  //   const values = [login, email];

  //   const res: User[] = await this.dataSource.query(query, values);
  //   const user = res[0];
  //   return res[0];
  // }

  async updatePassword(userId: string, passwordHash: string) {
    await this.usersTRepo.update({ id: userId }, { passwordHash });
  }

  async createConfirmationRecord(userId: string) {
    const data = this.regConfirmationRepo.create({ userId });
    await this.regConfirmationRepo.save(data);
  }

  async setCodeIsUsedToTrue(info: UserPasswordRecovery) {
    await this.passRecoveryRepo.update(
      { userId: info.userId },
      { codeIsUsed: true },
    );
  }

  async createUser(dto: Partial<User>): Promise<User['id']> {
    //   const insQuery = `
    // INSERT INTO public.users(
    // login, "passwordHash", email)
    // VALUES ($1, $2, $3);
    // `;

    //   const insVals = [dto.login, passHash, dto.email];
    //   const insertRes = await this.dataSource.query(insQuery, insVals);
    //   const query = `
    //   SELECT * FROM public.users
    //   WHERE login = $1 AND email = $2
    //   `;
    //   const values = [dto.login, dto.email];
    //   const user = await this.dataSource.query(query, values);
    //   return user[0].id;
    const user = this.usersTRepo.create(dto);
    const result = await this.usersTRepo.save(user);
    return result.id;
  }

  async deleteUserById(id: string): Promise<User['id'] | null> {
    // const searchQuery = `
    //   SELECT id FROM public.users
    //   WHERE id = $1;
    // `;
    // const user = await this.dataSource.query(searchQuery, [id]);
    // if (user.length === 0) return null;

    // const deleteQuery = `
    //   DELETE FROM public.users
    //   WHERE id = $1;
    // `;
    // await this.dataSource.query(deleteQuery, [id]);
    // await this.sessionsRepository.deleteAllUserSessions(user.id);
    const user = await this.usersTRepo.findOneBy({ id });
    if (!user) return null;
    const userId = user.id;
    await this.usersTRepo.remove(user);
    return userId;
  }

  async updateUserBanInfo(
    userId: string,
    banInfo: Pick<User, 'isBanned' | 'banDate' | 'banReason'>,
  ): Promise<void> {
    // const updateQuery = `
    //   UPDATE public.users
    //     SET "isBanned"=$1, "banDate"=$2, "banReason"=$3
    //     WHERE id = $4;
    // `;
    // await this.dataSource.query(updateQuery, [
    //   isBanned,
    //   banDate,
    //   banReason,
    //   userId,
    // ]);
    await this.usersTRepo.update({ id: userId }, banInfo);
  }

  async setNewPasswordRecoveryCode(userId: string) {
    const passwordRecoveryCode = uuidv4();
    const passwordRecoveryExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
    const passwordRecoveryCodeIsUsed = false;
    await this.passRecoveryRepo.upsert(
      {
        userId,
        recoveryCode: passwordRecoveryCode,
        codeExpDate: passwordRecoveryExpirationDate,
        codeIsUsed: passwordRecoveryCodeIsUsed,
      },
      ['userId'],
    );
    return passwordRecoveryCode;
    // const query = `
    //   UPDATE public.users
    //     SET "passwordRecoveryCode"=$1, "passwordRecoveryExpirationDate"=$2, "passwordRecoveryCodeIsUsed"=$3
    //     WHERE id=$4
    // `;
    // const values = [
    //   user.passwordRecoveryCode,
    //   user.passwordRecoveryExpirationDate,
    //   user.passwordRecoveryCodeIsUsed,
    //   user.id,
    // ];
    // await this.dataSource.query(query, values);
  }

  async updateEmailConfirmationCode(
    newInfo: UserRegisterConfirmation,
  ): Promise<void> {
    // const updateQuery = `
    //   UPDATE public.users
    //     SET "confirmationCode"=$1
    //     WHERE id = $2;
    // `;
    // await this.dataSource.query(updateQuery, [code, userId]);
    await this.regConfirmationRepo.save(newInfo);
  }

  //
  // async findUserByRecoveryCode(code: string): Promise<User> {
  //   const query = `
  //   SELECT * FROM public.users
  //   WHERE "passwordRecoveryCode" = $1
  //   `;
  //   const values = [code];
  //   const user = await this.dataSource.query(query, values);
  //   return user.length !== 0 ? user[0] : null;
  // }

  async setEmailIsConfirmedToTrue(userId: string): Promise<void> {
    // const updateQuery = `
    //   UPDATE public.users
    //     SET "confirmationCodeIsConfirmed"=TRUE
    //     WHERE id = $1;
    // `;
    // await this.dataSource.query(updateQuery, [userId]);
    await this.regConfirmationRepo.update(
      { userId },
      { codeIsConfirmed: true },
    );
  }

  // async saveUser(user: User): Promise<void> {
  //   const query = `
  //     UPDATE public.users
  //       SET login=$1, email=$2, "passwordHash"=$3, "createdAt"=$4, "isBanned"=$5, "banDate"=$6,
  //         "banReason"=$7, "confirmationCode"=$8, "confirmationCodeExpirationDate"=$9,
  //         "confirmationCodeIsConfirmed"=$10, "passwordRecoveryCode"=$11, "passwordRecoveryExpirationDate"=$12,
  //         "passwordRecoveryCodeIsUsed"=$13
  //       WHERE id=$14;
  //   `;
  //   const values = [
  //     user.login,
  //     user.email,
  //     user.passwordHash,
  //     user.createdAt,
  //     user.isBanned,
  //     user.banDate,
  //     user.banReason,
  //     user.confirmationCode,
  //     user.confirmationCodeExpirationDate,
  //     user.confirmationCodeIsConfirmed,
  //     user.passwordRecoveryCode,
  //     user.passwordRecoveryExpirationDate,
  //     user.passwordRecoveryCodeIsUsed,
  //     user.id,
  //   ];

  //   await this.dataSource.query(query, values);
  // }

  async findBannedUserForBlog(blogId: string, userId: string) {
    const query = `
      SELECT * FROM public.banned_users_for_blogs
      WHERE "user_id"=$1 AND "blog_id"=$2
    `;

    const bannedUser = await this.dataSource.query(query, [userId, blogId]);
    return bannedUser[0];
  }

  async deleteAllUsers() {
    const query = `
    DELETE FROM public.users
    `;
    await this.dataSource.query(query);
  }

  async deleteAllSessions() {
    const query = `
    DELETE FROM public.sessions
    `;
    await this.dataSource.query(query);
  }

  private toPlainUserDto(user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      isBanned: user.isBanned,
      banReason: user.banReason,
      banDate: user.banDate,
    };
  }
}
