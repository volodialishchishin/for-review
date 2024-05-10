import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { SortDirection } from '../../users/dtos/users-paginator';
import { BlogPost } from '../entities/blogpost.entity';
import { PaginationView } from '../../common_models/pagination-view.model';

export class PostPaginator {
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

export interface PostsPagination extends PaginationView {
  items: Partial<BlogPost>[];
}
