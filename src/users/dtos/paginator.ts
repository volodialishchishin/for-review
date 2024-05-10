import { PaginationView } from '../../common_models/pagination-view.model';
import { User } from '../entities/user.entity';

export interface UsersPagination extends PaginationView {
  items: Partial<User>[];
}
