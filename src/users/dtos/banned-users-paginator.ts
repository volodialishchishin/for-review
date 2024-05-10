import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { SortDirection, UserPaginator } from './users-paginator';

export class BannedUsersPaginator {
  @IsString()
  @IsOptional()
  sortBy = 'createdAt';

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
  searchLoginTerm: string | null = null;
}
