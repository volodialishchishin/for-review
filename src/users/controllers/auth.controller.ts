import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { EmailDto } from '../dtos/email.dto';
import { NewPasswordDto } from '../dtos/new-password.dto';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import { AuthUserDto, ConfirmationCode } from '../dtos/aurh-user.dto';
import { SessionsService } from '../services/sessions.service';
import { BearerAuthGuard } from '../guards/bearer.auth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  @Post('login')
  async loginUser(
    @Ip() ip: string,
    @Headers('user-agent') title: string,
    @Res() res: Response,
    @Body() authUserDto: AuthUserDto,
  ) {
    const result = await this.usersService.loginUser(
      authUserDto.loginOrEmail,
      authUserDto.password,
    );
    if (!result) return res.sendStatus(401);
    const { accessToken, refreshToken } = result;

    await this.sessionsService.createNewSession(refreshToken, ip, title);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Boolean(process.env.HTTP_SECURE) || false,
    });
    res.status(200).send({ accessToken });
  }

  // @SkipThrottle()
  @UseGuards(BearerAuthGuard)
  @Get('me')
  async getCurrentUserInfo(@Req() req: Request) {
    const user = await this.usersQueryRepo.findUserById(req.user!.id);
    return {
      email: user!.email,
      login: user!.login,
      userId: req.user!.id,
    };
  }

  @HttpCode(204)
  @Post('registration')
  async registerUser(@Body() createUserDto: CreateUserInputDto) {
    const user = await this.usersQueryRepo.findUserByLoginOrEmail(
      createUserDto.login,
      createUserDto.email,
    );
    if (user) {
      const errorField = user.login === createUserDto.login ? 'login' : 'email';
      throw new BadRequestException({
        message: `User with this ${errorField} is already registered`,
        field: `${errorField}`,
      });
    }
    const newUserId = await this.usersService.createNewUser(createUserDto);
    await this.usersService.sendEmailConfirmation(
      newUserId,
      createUserDto.email,
    );
  }

  @HttpCode(204)
  @Post('registration-confirmation')
  async comfirmRegistration(@Body() confirmationCode: ConfirmationCode) {
    const result = await this.usersService.confirmEmail(confirmationCode.code);
    if (!result) {
      throw new BadRequestException({
        message:
          'Confirmation code is incorrect, expired or already been applied',
        field: 'code',
      });
    }
  }

  @HttpCode(204)
  @Post('registration-email-resending')
  async resendRegistrationEmail(@Body() emailDto: EmailDto) {
    await this.usersService.resendRegistrationEmail(emailDto.email);
  }

  // @SkipThrottle()
  @Post('refresh-token')
  async refreshTokens(
    @Ip() ip: string,
    @Headers('user-agent') browserTitle: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const result = await this.authService.refreshTokens(
      refreshToken,
      ip,
      browserTitle,
    );
    const { newAccessToken, newRefreshToken } = result;
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: Boolean(process.env.HTTP_SECURE) || false,
    });
    res.status(200).send({ accessToken: newAccessToken });
  }

  // @SkipThrottle()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    await this.usersService.logoutUser(refreshToken);
    res.sendStatus(204);
  }

  @HttpCode(204)
  @Post('password-recovery')
  async recoverPassword(@Body() emailDto: EmailDto) {
    const email = emailDto.email;
    await this.usersService.recoverPassword(email);
  }

  @HttpCode(204)
  @Post('new-password')
  async confirmNewPassword(@Body() newPasswordDto: NewPasswordDto) {
    await this.usersService.updateRecoveryCodeAndPassword(newPasswordDto);
  }
}
