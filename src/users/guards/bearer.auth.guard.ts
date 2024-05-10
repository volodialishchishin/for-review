import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UsersQueryRepository } from '../../users/repositories/users.query-repository';
import { AuthService } from '../services/auth.service';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    protected authService: AuthService,
    protected usersQueryRepo: UsersQueryRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const userId = await this.authService.validateUserBearer(authorization);
    const userLogin = await this.usersQueryRepo.getUserLoginById(userId);
    request.user = {
      id: userId,
      login: userLogin,
    };
    if (userId) return true;
    else return false;
  }
}
