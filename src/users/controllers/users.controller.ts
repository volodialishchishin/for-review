import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BanUserDto } from '../dtos/ban-user.dto';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { UsersPagination } from '../dtos/paginator';
import { UserPaginator } from '../dtos/users-paginator';
import { BasicAuthGuard } from '../guards/basic.auth.guard';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from '../services/users.service';

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class UsersController {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly usersRepository: UsersRepository,
    private readonly userService: UsersService,
  ) {}

  @Get()
  async findAll(
    @Query() userPaginatorQuery: UserPaginator,
  ): Promise<UsersPagination> {
    const users = await this.usersQueryRepository.findAll(userPaginatorQuery);
    return users;
  }

  @Post()
  async create(@Body() dto: CreateUserInputDto) {
    const newUserId = await this.userService.createNewUser(dto);
    return this.usersQueryRepository.findUserById(newUserId);
  }

  @HttpCode(204)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const deletedUserId = await this.usersRepository.deleteUserById(id);
    if (!deletedUserId) throw new NotFoundException();
  }

  @HttpCode(204)
  @Put(':id/ban')
  async banUnbanUser(
    @Param('id') userId: string,
    @Body() banUserDto: BanUserDto,
  ) {
    await this.userService.banUnbanUser(userId, banUserDto);
  }
}
