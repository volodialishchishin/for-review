import { v4 as uuidv4 } from 'uuid';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { BanUserDto } from '../dtos/ban-user.dto';
import { SessionsRepository } from '../repositories/sessions.repository';
import { JwtService } from '../../utils/jwt.service';
import { EmailService } from '../../utils/email.service';
import { NewPasswordDto } from '../dtos/new-password.dto';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import { UserPasswordRecovery } from '../entities/user-pass-recovery.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async loginUser(loginOrEmail: string, password: string) {
    const user = await this.usersQueryRepository.findUserByLoginOrEmail(
      loginOrEmail,
      loginOrEmail,
    );
    if (!user || user.isBanned) return null;
    const isValidUser = await this.checkCredentials(user, password);
    if (isValidUser) {
      const deviceId = uuidv4();
      return {
        accessToken: await this.jwtService.createJwtAccessToken(user.id),
        refreshToken: await this.jwtService.createJwtRefresh(user.id, deviceId),
      };
    }
    return null;
  }

  async logoutUser(refreshToken: string) {
    const validSession = await this.sessionsRepository.verifySessionByToken(
      refreshToken,
    );
    if (!validSession) throw new UnauthorizedException();

    await this.sessionsRepository.deleteSession(validSession.id);
  }

  async createNewUser(dto: CreateUserInputDto): Promise<User['id']> {
    const passHash = await this.hashPassword(dto.password);
    const userId = await this.usersRepository.createUser({
      login: dto.login,
      passwordHash: passHash,
      email: dto.email,
    });
    await this.usersRepository.createConfirmationRecord(userId);
    return userId;
  }

  async banUnbanUser(userId: string, banUserDto: BanUserDto) {
    let isBanned: boolean;
    let banReason: string | null;
    let banDate: Date | null;

    isBanned = banUserDto.isBanned;
    if (!banUserDto.isBanned) {
      banReason = null;
      banDate = null;
    } else {
      banReason = banUserDto.banReason;
      banDate = new Date();
    }
    await this.usersRepository.updateUserBanInfo(userId, {
      isBanned,
      banReason,
      banDate,
    });

    await this.sessionsRepository.deleteAllUserSessions(userId);
  }

  async sendEmailConfirmation(userId: string, email: string) {
    const info = await this.usersQueryRepository.findUsersConfirmInfoById(
      userId,
    );
    if (!info) return null;
    try {
      await this.emailService.sendEmailConfirmationMessage(email, info.code);
    } catch (error) {
      console.log('Could not send email!');
      console.log(error);
      return;
    }
  }

  async confirmEmail(code: string): Promise<boolean> {
    const info = await this.usersQueryRepository.findUsersConfirmInfoByCode(
      code,
    );
    if (
      !info ||
      info.code !== code ||
      info.codeExpirationDate < new Date() ||
      info.codeIsConfirmed
    ) {
      return false;
    }
    await this.usersRepository.setEmailIsConfirmedToTrue(info.userId);
    return true;
  }

  async resendRegistrationEmail(email: string) {
    const user = await this.usersQueryRepository.findUserByEmail(email);
    let confirmInfo = null;
    if (user) {
      confirmInfo = await this.usersQueryRepository.findUsersConfirmInfoById(
        user.id,
      );
    }
    console.log(user);
    console.log(confirmInfo);
    let newConfirmationCode = null;
    if (user && confirmInfo && !confirmInfo.codeIsConfirmed) {
      console.log('here');
      newConfirmationCode = uuidv4();
      confirmInfo.code = newConfirmationCode;
      this.usersRepository.updateEmailConfirmationCode(confirmInfo);

      await this.emailService.sendEmailConfirmationMessage(
        user.email,
        newConfirmationCode,
      );
    } else {
      throw new BadRequestException({
        message: `Email is already confirmed or doesn't exist`,
        field: 'email',
      });
    }
  }

  async recoverPassword(email: string) {
    const registeredUser = await this.usersQueryRepository.findUserByEmail(
      email,
    );
    if (!registeredUser) return;

    const newCode = await this.usersRepository.setNewPasswordRecoveryCode(
      registeredUser.id,
    );
    await this.emailService.sendPasswordRecoveryMessage(
      registeredUser.email,
      newCode,
    );
  }

  private async checkRecoveryCode(
    info: UserPasswordRecovery | null,
  ): Promise<boolean> {
    if (!info) {
      return false;
    }
    if (info.codeExpDate < new Date() || info.codeIsUsed) {
      return false;
    }
    return true;
  }

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 1);
  }

  async updateRecoveryCodeAndPassword(data: NewPasswordDto) {
    const info =
      await this.usersQueryRepository.findUsersRecoveryPassInfoByCode(
        data.recoveryCode,
      );
    const isRecoveryCodeValid = await this.checkRecoveryCode(info);
    if (!isRecoveryCodeValid || !info)
      throw new BadRequestException({
        message: 'Recovery code is not valid or already been used',
        field: 'recoveryCode',
      });

    const passwordHash = await bcrypt.hash(data.newPassword, 1);
    await this.usersRepository.updatePassword(info.userId, passwordHash);
    await this.usersRepository.setCodeIsUsedToTrue(info);
  }

  async checkCredentials(user: User, password: string): Promise<boolean> {
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? true : false;
  }
}
