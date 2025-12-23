import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { type Request, type Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('1. Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists.',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const tokens = await this.authService.register(registerDto);
    return this._setTokens(tokens);
  }

  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Email or password is invalid',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const tokens = await this.authService.login(loginDto);
    return this._setTokens(tokens);
  }

  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request) {
    const refreshToken = req.user?.refreshToken as string;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    return { message: 'Logout successful' };
  }

  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Token successfully refreshed.' })
  @ApiResponse({
    status: 403,
    description: 'The token is invalid or has expired',
  })
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(@Req() req: Request) {
    const refreshToken = req.user?.refreshToken as string;
    if (!refreshToken) {
      throw new ForbiddenException('Refresh token not found');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    return this._setTokens(tokens);
  }

  private _setTokens(tokens: { accessToken: string; refreshToken: string }) {
    return {
      ...tokens,
      expiresIn: this.configService.get<number>('COOKIE_ACCESS_MAX_AGE'),
      refreshExpiresIn: this.configService.get<number>(
        'COOKIE_REFRESH_MAX_AGE',
      ),
    };
  }
}
