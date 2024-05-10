import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../../utils/jwt.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}
  async validateUserBasic(authorization: string | null): Promise<boolean> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const [method, encoded] = authorization.split(' ');
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');

    const [username, password]: Array<string> = decoded.split(':');
    if (
      method !== 'Basic' ||
      username !== 'admin' ||
      password !== process.env.ADMIN_PASS
    ) {
      throw new UnauthorizedException();
    }
    return true;
  }

  async validateUserBearer(authorization: string | undefined): Promise<string> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const token = authorization.split(' ')[1];

    const userId = await this.jwtService.getUserIdFromAccessToken(token);

    if (!userId) {
      throw new UnauthorizedException();
    }
    return userId;
  }

  async refreshTokens(
    refreshToken: string,
    ip: string,
    title: string,
  ): Promise<{ newAccessToken: string; newRefreshToken: string }> {
    const validSession = await this.sessionsRepository.verifySessionByToken(
      refreshToken,
    );
    if (!validSession) throw new UnauthorizedException();

    const newAccessToken = await this.jwtService.createJwtAccessToken(
      validSession.userId,
    );
    const newRefreshToken = await this.jwtService.createJwtRefresh(
      validSession.userId,
      validSession.deviceId,
    );
    const tokenData: any = jwt.verify(
      newRefreshToken,
      process.env.SECRET as jwt.Secret,
    );
    await this.sessionsRepository.updateSession(
      validSession.id,
      ip,
      title,
      tokenData.iat,
      tokenData.exp,
    );
    return { newAccessToken, newRefreshToken };
  }
}
