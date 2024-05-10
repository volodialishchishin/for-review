import { ShortLikeInfo } from '../../common_models/extended-likes-info.model';
import { Reaction } from '../../reactions/reaction.model';
import { PostViewModel } from './post-view.model';

export class PostDbModel extends PostViewModel {
  blogName: string;
  likesCount: number;
  dislikesCount: number;
  myStatus: Reaction;
  newestLikes: ShortLikeInfo[];
}
