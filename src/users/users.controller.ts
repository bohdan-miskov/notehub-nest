import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findOne(@Req() req: Request) {
    const userId = req.user?.id as number;
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  update(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.usersService.update(userId, updateUserDto);
  }
}
