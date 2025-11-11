import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('3. Users')
@ApiCookieAuth('accessToken')
@ApiResponse({
  status: 401,
  description: 'Tokens are invalid or expired',
})
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({
    status: 200,
    description: 'User successfully found',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('me')
  findOne(@Req() req: Request) {
    const userId = req.user?.id as number;
    return this.usersService.findOne(userId);
  }

  @ApiResponse({
    status: 200,
    description: 'User info successfully updated.',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Patch('me')
  update(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.usersService.update(userId, updateUserDto);
  }
}
