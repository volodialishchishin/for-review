import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';

export type SortDirection = 'ASC' | 'DESC' | undefined;

type BanStatus = 'all' | 'banned' | 'notBanned';

export class UserPaginator {
  @IsIn(['all', 'banned', 'notBanned'])
  @IsOptional()
  banStatus: BanStatus = 'all';

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

  @IsString()
  @IsOptional()
  searchEmailTerm: string | null = null;
}
