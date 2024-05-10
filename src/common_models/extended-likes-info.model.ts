import { Reaction } from '../reactions/reaction.model';

export interface ShortLikeInfo {
  addedAt: Date;
  userId: string;
  login: string;
}

export interface ExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: Reaction;
  newestLikes: ShortLikeInfo[];
}
