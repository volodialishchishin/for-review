import { Test, TestingModule } from '@nestjs/testing';
import { UsersQueryRepository } from '../users.query-repository';

describe('UsersService', () => {
  let service: UsersQueryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersQueryRepository],
    }).compile();

    service = module.get<UsersQueryRepository>(UsersQueryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
