import { IsEmail, IsNotEmpty, Length, Matches } from "class-validator";

export class CreateUserInputDto {
  @Matches(/^[a-zA-Z0-9_-]*$/)
  @Length(3, 10)
  @IsNotEmpty()
  login: string;

  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsEmail()
  email: string;

  @Length(6, 20)
  @IsNotEmpty()
  password: string;
}