import { Delete, Get, Post, Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    @Get('/entire')
    getUser() {}

    @Get('/:id')
    getUserById() {}

    @Post()
    createUser() {}

    @Delete('/:id')
    removeUser() {}

    @Put('/:id')
    updateUser() {}
}
