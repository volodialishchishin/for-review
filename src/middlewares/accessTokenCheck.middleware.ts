import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '../utils/jwt.service';
import { UsersQueryRepository } from '../users/repositories/users.query-repository';

@Injectable()
export class AccessTokenValidationMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    protected usersQueryRepo: UsersQueryRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    if (!authorization) {
      req.user = null;
      return next();
    }
    const token = authorization.split(' ')[1];

    const userId = await this.jwtService.getUserIdFromAccessToken(token);
    let userLogin = '';
    if (userId) {
      userLogin = await this.usersQueryRepo.getUserLoginById(userId!);
    }

    req.user = {
      id: userId!,
      login: userLogin,
    };

    return next();
  }
}
