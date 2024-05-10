import {
  Controller,
  Delete,
  Get,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionsRepository } from '../repositories/sessions.repository';

@Controller('security')
export class SessionsController {
  constructor(private readonly sessionRepo: SessionsRepository) {}

  @Get('devices')
  async getActiveSessions(@Res() res: Response, @Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();

    const activeSessions = await this.sessionRepo.getActiveSessions(
      refreshToken,
    );

    return res.send(activeSessions);
  }

  @Delete('devices')
  async deleteRestSessions(@Res() res: Response, @Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();

    await this.sessionRepo.deleteRestSessions(refreshToken);

    return res.sendStatus(204);
  }

  @Delete('devices/:deviceId')
  async deleteDeviceSessions(
    @Param('deviceId') deviceId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();

    await this.sessionRepo.deleteDeviceSessions(refreshToken, deviceId);

    return res.sendStatus(204);
  }
}
