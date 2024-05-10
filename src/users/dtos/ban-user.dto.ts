import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class BanUserDto {
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;

  @IsString()
  @MinLength(20)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  banReason: string;
}
