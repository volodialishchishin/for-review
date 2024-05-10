import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UsersPagination } from '../dtos/paginator';
import { SortDirection, UserPaginator } from '../dtos/users-paginator';
import { User } from '../entities/user.entity';
import { UserRegisterConfirmation } from '../entities/user-register-confirmation.entity';
import { UserPasswordRecovery } from '../entities/user-pass-recovery.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User) private readonly usersTRepo: Repository<User>,
    @InjectRepository(UserRegisterConfirmation)
    private readonly regConfirmationRepo: Repository<UserRegisterConfirmation>,
    @InjectRepository(UserPasswordRecovery)
    private readonly passRecoveryRepo: Repository<UserPasswordRecovery>,
  ) {}
  async findAll(paginator: UserPaginator): Promise<UsersPagination> {
    const banStatus =
      paginator.banStatus === 'all'
        ? [true, false]
        : paginator.banStatus === 'banned'
        ? [true]
        : [false];
    const searchLoginTerm = paginator.searchLoginTerm
      ? '%' + paginator.searchLoginTerm + '%'
      : '%';
    const searchEmailTerm = paginator.searchEmailTerm
      ? '%' + paginator.searchEmailTerm + '%'
      : '%';
    const sortBy = paginator.sortBy;
    const sortDirection =
      paginator.sortDirection?.toUpperCase() as SortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    // const query = `
    // SELECT * FROM public.users
    // WHERE (LOWER(login) LIKE LOWER($1) OR email LIKE $2) AND ("isBanned" = ${banStatus})
    // ORDER BY "${sortBy}" ${sortDirection}
    // LIMIT $3 OFFSET $4
    // `;
    // const values = [searchLoginTerm, searchEmailTerm, pageSize, skip];
    // const users = await this.dataSource.query(query, values);

    // const totalCountQuery = `
    // SELECT COUNT(id) FROM public.users
    // WHERE (LOWER(login) LIKE LOWER($1) OR email LIKE $2) AND ("isBanned" = ${banStatus})
    // `;
    // const result = await this.dataSource.query(totalCountQuery, [
    //   searchLoginTerm,
    //   searchEmailTerm,
    // ]);
    // const totalCount = Number(result[0].count);
    const [users, totalCount] = await this.usersTRepo
      .createQueryBuilder('u')
      .where('(LOWER(u.login) LIKE LOWER(:login) OR u.email LIKE :email)', {
        login: `${searchLoginTerm}`,
        email: `${searchEmailTerm}`,
      })
      .andWhere('u."isBanned" = ANY(:banStatus)', { banStatus })
      .orderBy(`u."${sortBy}"`, sortDirection)
      .limit(pageSize)
      .offset(skip)
      .getManyAndCount();

    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: users.map(this.toUserDto),
    };
  }

  async findUserById(newUserId: string | null) {
    if (!newUserId) return null;
    const user = await this.usersTRepo.findOneBy({ id: newUserId });
    if (!user) return null;
    // const query = `
    // SELECT * FROM public.users
    // WHERE id = $1
    // `;
    // const values = [newUserId];
    // const user = await this.dataSource.query(query, values);
    return this.toUserDto(user);
  }

  async getUserLoginById(id: string): Promise<User['login']> {
    const user = await this.findUserById(id);
    return user!.login;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.usersTRepo.findOneBy({ email });
    return user;
    // const query = `
    // SELECT * FROM public.users
    // WHERE email = $1
    // `;
    // const values = [email];
    // const user = await this.dataSource.query(query, values);
    // return user[0];
  }

  async findUserByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<User | null> {
    // const query = `
    // SELECT * FROM public.users
    // WHERE login = $1 OR email = $2
    // `;

    // const values = [login, email];

    // const res: User[] = await this.dataSource.query(query, values);
    // const user = res[0];
    // return res[0];
    const user = await this.usersTRepo.findOne({
      where: [{ login }, { email }],
    });
    return user ? user : null;
  }

  async findUsersConfirmInfoByCode(code: string) {
    const info = await this.regConfirmationRepo.findOneBy({
      code,
    });
    return info;
  }

  async findUsersConfirmInfoById(id: string) {
    const info = await this.regConfirmationRepo.findOneBy({
      userId: id,
    });
    return info;
  }

  async findUsersRecoveryPassInfoByCode(recoveryCode: string) {
    const info = await this.passRecoveryRepo.findOneBy({
      recoveryCode,
    });
    return info;
  }

  private toUserDto(user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: user.isBanned,
        banReason: user.banReason,
        banDate: user.banDate,
      },
    };
  }
}
