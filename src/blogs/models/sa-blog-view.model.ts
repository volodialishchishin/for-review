import { BlogOwnerInfo } from './blog-owner-info.model';
import { BanInfo } from './ban-info.model';
import { PublicBlogViewModel } from './public-blog-view.model';

export type SaBlogViewModel = PublicBlogViewModel & {
  blogOwnerInfo: BlogOwnerInfo;
  banInfo: BanInfo;
};
