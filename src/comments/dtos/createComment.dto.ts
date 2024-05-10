import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(300)
  @MinLength(20)
  content: string;
}
