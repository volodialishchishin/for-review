import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBlogDto {
  @MaxLength(15)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value?.trim() : value,
  )
  @IsString()
  name: string;

  @MaxLength(500)
  @IsNotEmpty()
  description: string;

  @MaxLength(100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  @IsNotEmpty()
  websiteUrl: string;
}
