import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { type Request, type Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParseImagePipe } from 'src/common/pipes/parse-image.pipe';

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
    @UploadedFile(new ParseImagePipe()) avatar?: Express.Multer.File,
  ) {
    const tokens = await this.authService.register(registerDto, avatar);
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

  @UseGuards(AuthGuard('google'))
  @Get('get-google-oauth')
  async getGoogleOauth() {}

  @UseGuards(AuthGuard('google'))
  @Get('confirm-google-oauth')
  async confirmGoogleOauth(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('OAuth error');
    }
    const tokens = await this.authService.loginOAuth(user);
    const tokensData = this._setTokens(tokens);

    const nextServerUrl = this.configService.get<string>('NEXT_SERVER_URL');
    const redirectUrl = new URL(`${nextServerUrl}/api/auth/set-oauth`);
    redirectUrl.searchParams.append('accessToken', tokensData.accessToken);
    if (tokensData.expiresIn) {
      redirectUrl.searchParams.append(
        'expiresIn',
        tokensData.expiresIn.toString(),
      );
    }
    redirectUrl.searchParams.append('refreshToken', tokensData.refreshToken);
    if (tokensData.refreshExpiresIn) {
      redirectUrl.searchParams.append(
        'refreshExpiresIn',
        tokensData.refreshExpiresIn.toString(),
      );
    }
    return res.redirect(redirectUrl.toString());
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
