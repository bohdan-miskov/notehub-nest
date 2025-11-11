import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  Res,
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
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(registerDto);
    this._setCookies(res, tokens);
    return { message: 'Registration successful' };
  }

  @ApiResponse({ status: 201, description: 'User successfully logged in.' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Email or password is invalid',
  })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto);
    this._setCookies(res, tokens);
    return { message: 'Login successful' };
  }

  @ApiResponse({ status: 201, description: 'User successfully logged out.' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refreshToken as string;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logout successful' };
  }

  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 201, description: 'Token successfully refreshed.' })
  @ApiResponse({
    status: 403,
    description: 'The token is invalid or has expired',
  })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken as string;
    if (!refreshToken) {
      throw new ForbiddenException('Refresh token not found');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    this._setCookies(res, tokens);
    return { message: 'Tokens refreshed' };
  }

  private _setCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('COOKIE_ACCESS_MAX_AGE'),
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('COOKIE_REFRESH_MAX_AGE'),
    });
  }
}
