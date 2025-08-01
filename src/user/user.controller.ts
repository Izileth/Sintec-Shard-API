import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './types';
import { JwtGuard } from 'src/guards/private.jwt.guard';
import { GetUser } from 'src/decorator/private.user.decorator';
import { User } from 'generated/prisma';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@GetUser() user: User) {
    return this.userService.getUsers(user.id);
  }

  @Get('me')
  async getCurrentUser(@GetUser() user: User) {
    return this.userService.getUserById(user.id);
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Put('update/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserDto
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Delete('detete/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deactivateUser(id);
  }
}