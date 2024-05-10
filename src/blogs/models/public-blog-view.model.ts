import { Blog } from '../entities/blog.entity';

export type PublicBlogViewModel = Omit<
  Blog,
  'ownerId' | 'isBanned' | 'banDate' | 'owner' | 'posts'
>;
