import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionsService } from 'src/sessions/sessions.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this._hashData(password);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this._getAndSaveTokens(user);
    return tokens;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this._getAndSaveTokens(user);
    return tokens;
  }

  async logout(refreshToken: string) {
    const hash = await this._hashData(refreshToken);
    await this.sessionsService.deleteSession(hash);
  }

  async refreshTokens(refreshToken: string) {
    const hashedToken = await this._hashData(refreshToken);

    const session = await this.sessionsService.findSessionByHash(hashedToken);

    if (!session) {
      throw new ForbiddenException('Access Denied: Session not found');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionsService.deleteSession(hashedToken);
      throw new ForbiddenException('Access Denied: Token expired');
    }

    await this.sessionsService.deleteSession(hashedToken);

    const tokens = this._getAndSaveTokens(session.user);
    return tokens;
  }

  private async _hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  private async _getAndSaveTokens(user: User) {
    const rsaRefreshExpiresDays =
      this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS') ?? 7;
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(
      refreshExpiresAt.getDate() + rsaRefreshExpiresDays,
    );

    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: `${this.configService.get<number>('JWT_ACCESS_EXPIRES_MINUTES') ?? 15}m`,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${rsaRefreshExpiresDays}d`,
      }),
    ]);

    const refreshTokenHash = await this._hashData(refreshToken);

    await this.sessionsService.createSession(
      user,
      refreshTokenHash,
      refreshExpiresAt,
    );

    return { accessToken, refreshToken };
  }
}
