import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePostDto {
  @MaxLength(30)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  title: string;

  @MaxLength(100)
  @IsNotEmpty()
  shortDescription: string;

  @MaxLength(1000)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  content: string;
}
