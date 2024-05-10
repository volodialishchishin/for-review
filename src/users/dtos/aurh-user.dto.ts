import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AuthUserDto {
  @IsString()
  @IsNotEmpty()
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ConfirmationCode {
  @IsUUID()
  code: string;
}
