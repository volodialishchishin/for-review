import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { SortDirection } from '../../users/dtos/users-paginator';
import { Blog } from '../entities/blog.entity';
import { PaginationView } from '../../common_models/pagination-view.model';

export class BlogsPaginator {
  @IsString()
  @IsOptional()
  sortBy = 'created_at';

  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
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

  @IsString()
  @IsOptional()
  searchNameTerm: string | null = null;
}

export interface BlogsPagination extends PaginationView {
  items: Partial<Blog>[];
}
