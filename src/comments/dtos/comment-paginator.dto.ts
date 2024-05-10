import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { SortDirection } from '../../users/dtos/users-paginator';
import { PaginationView } from '../../common_models/pagination-view.model';

export class CommentsPaginator {
  @IsString()
  @IsOptional()
  sortBy = 'createdAt';

  @IsIn(['asc', 'desc', 'DESC', 'ASC'])
  @IsOptional()
  sortDirection: SortDirection = 'DESC';

  @IsPositive()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsOptional()
  pageNumber = 1;

  @IsPositive()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsOptional()
  pageSize = 10;
}

export interface CommentPagination extends PaginationView {
  items: Partial<Comment>[];
}
