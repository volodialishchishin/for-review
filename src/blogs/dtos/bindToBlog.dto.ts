import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class BindToBlogDto {
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  blogId: string;

  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  userId: string;
}
