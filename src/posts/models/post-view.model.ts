import { BlogPost } from '../entities/blogpost.entity';
import { ExtendedLikesInfo } from '../../common_models/extended-likes-info.model';

export class PostViewModel extends BlogPost {
  blogName: string;
  extendedLikesInfo: ExtendedLikesInfo;
}
