import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { CreateSessionDto } from '../dtos/create-session.dto';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Session)
    private readonly sessionTRepository: Repository<Session>,
  ) {}

  async createNewSession(createSessionDto: CreateSessionDto): Promise<void> {
    const session = await this.sessionTRepository.create(createSessionDto);
    await this.sessionTRepository.save(session);
    //   const sessionInsertQuery = `
    //   INSERT INTO public.sessions(
    //  ip, "title", "lastActiveDate", "deviceId", "tokenExpireDate", "userId")
    // VALUES ($1, $2, $3, $4, $5, $6)
    //   `;

    //   const values = [
    //     createSessionDto.ip,
    //     createSessionDto.browserTitle,
    //     createSessionDto.lastActiveDate,
    //     createSessionDto.deviceId,
    //     createSessionDto.tokenExpireDate,
    //     createSessionDto.userId,
    //   ];
    //   await this.dataSource.query(sessionInsertQuery, values);
    return;
  }

  async updateSession(
    sessionId: string,
    ip: string,
    title: string,
    newActiveDate: number,
    newTokenExpDate: number,
  ): Promise<void> {
    await this.sessionTRepository.update(
      { id: sessionId },
      {
        ip,
        title,
        lastActiveDate: new Date(newActiveDate * 1000),
        tokenExpireDate: new Date(newTokenExpDate * 1000),
      },
    );
    // const query = `
    //  UPDATE public.sessions
    //   SET "ip"=$1, "title"=$2, "lastActiveDate"=$3, "tokenExpireDate"=$4
    //   WHERE id=$5
    // `;
    // const values = [
    //   ip,
    //   title,
    //   new Date(newActiveDate * 1000),
    //   new Date(newTokenExpDate * 1000),
    //   sessionId,
    // ];
    // await this.dataSource.query(query, values);
  }

  async deleteSession(id: string) {
    // const query = `
    //   DELETE FROM public.sessions
    //     WHERE id=$1
    // `;

    // await this.dataSource.query(query, [id]);
    await this.sessionTRepository.delete({ id });
  }

  async findUserByLoginOrEmail(login: string, email: string): Promise<User> {
    const insQuery = `
  INSERT INTO public.users(
	login, password, email)
	VALUES ($1, $2, $3);
  `;
    const passHash = await this.hashPassword('123456');
    const insVals = [login, passHash, email];
    const insertRes = await this.dataSource.query(insQuery, insVals);

    const query = `
    SELECT * FROM public.users
    WHERE login = $1 OR email = $2
    `;

    const values = [login, email];

    const res: User[] = await this.dataSource.query(query, values);
    const user = res[0];
    return user;
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    // const deleteQuery = `
    //   DELETE FROM public.sessions
    //   WHERE "userId" = $1;
    // `;
    // await this.dataSource.query(deleteQuery, [userId]);
    await this.sessionTRepository.delete({ userId });
  }

  async verifySessionByToken(token: string): Promise<Session | null> {
    try {
      const tokenData: any = jwt.verify(
        token,
        process.env.SECRET as jwt.Secret,
      );
      if (tokenData.exp < Date.now() / 1000) {
        return null;
      }
      const lastActiveDate = new Date(tokenData.iat * 1000);
      const deviceId = tokenData.deviceId;
      const userId = tokenData.userId;
      // const query = `
      //   SELECT * FROM public.sessions
      //   WHERE "lastActiveDate"=$1 AND
      //   "deviceId"=$2 AND
      //   "userId"=$3
      // `;
      // const values = [lastActiveDate, deviceId, userId];
      // const result = await this.dataSource.query(query, values);
      // return result[0];
      const session = await this.sessionTRepository.findOne({
        where: {
          lastActiveDate,
          deviceId,
          userId,
        },
      });
      console.log(session);
      return session;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }

  async getActiveSessions(refreshToken: string) {
    const validSession = await this.verifySessionByToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    //     const query = `
    //     SELECT ip, title, "lastActiveDate", "deviceId" FROM public.sessions
    //     WHERE "userId"=$1

    // `;
    const sessionFound = await this.sessionTRepository.find({
      select: {
        ip: true,
        title: true,
        lastActiveDate: true,
        deviceId: true,
      },
      where: {
        userId,
      },
    });
    if (sessionFound.length === 0) throw new UnauthorizedException();
    console.log(sessionFound);

    return sessionFound;
  }

  async deleteRestSessions(refreshToken: string): Promise<void> {
    const validSession = await this.verifySessionByToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const deviceId = validSession.deviceId;
    // const deleteQuery = `
    // DELETE FROM public.sessions
    //   WHERE "userId"=$1 AND "deviceId"!=$2;
    // `;
    // await this.dataSource.query(deleteQuery, [userId, deviceId]);
    await this.sessionTRepository
      .createQueryBuilder()
      .delete()
      .where('"userId" = :userId AND "deviceId" != :deviceId', {
        userId,
        deviceId,
      })
      .execute();
    return;
  }

  async deleteAllBannedUserSessions(userId: string): Promise<void> {
    // const deleteQuery = `
    // DELETE FROM public.sessions
    //   WHERE "userId"=$1
    // `;
    await this.sessionTRepository.delete({ userId });
  }

  async deleteDeviceSessions(
    refreshToken: string,
    deviceId: string,
  ): Promise<void> {
    const validSession = await this.verifySessionByToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    // const sessionQuery = `
    // SELECT * FROM public.sessions
    //   WHERE "deviceId"=$1
    // `;
    const foundDeviceSession = await this.sessionTRepository.findBy({
      deviceId,
    });
    if (foundDeviceSession.length === 0) {
      throw new NotFoundException();
    }
    for (const session of foundDeviceSession) {
      if (session.userId !== userId) throw new ForbiddenException();
    }
    // if (foundDeviceSession[0].userId !== userId) {
    //   throw new ForbiddenException();
    // } else {
    //   const deleteQuery = `
    //   DELETE FROM public.sessions
    //     WHERE "deviceId"=$1
    //   `;
    try {
      await this.sessionTRepository.delete({ deviceId });
    } catch (error) {
      console.log(error);
      console.log('cannot delete device session');
      throw new BadRequestException();
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 1);
  }

  async toUserDto(user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      isBanned: user.isBanned,
      banDate: user.banDate,
      banReason: user.banReason,
    };
  }
}
