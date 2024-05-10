import { PaginationView } from '../../common_models/pagination-view.model';
import { SaBlogViewModel } from './sa-blog-view.model';

export class SaBlogsPagination extends PaginationView {
  items: SaBlogViewModel[];
}
