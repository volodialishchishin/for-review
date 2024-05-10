import { PaginationView } from '../../common_models/pagination-view.model';
import { PublicBlogViewModel } from './public-blog-view.model';

export class PublicBlogsPagination extends PaginationView {
  items: PublicBlogViewModel[];
}
