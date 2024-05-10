import { IsIn } from 'class-validator';
import { Reaction } from './reaction.model';

export class LikeInputDto {
  @IsIn(['None', 'Like', 'Dislike'])
  likeStatus: Reaction;
}
