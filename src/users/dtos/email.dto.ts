import { IsEmail, IsNotEmpty, Matches } from "class-validator";

export class EmailDto {
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsNotEmpty()
  @IsEmail()
  email: string;
}