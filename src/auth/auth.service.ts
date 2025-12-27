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
import * as crypto from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { addDays } from 'src/common/utils/addDays';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, avatar?: Express.Multer.File) {
    const { email, password } = registerDto;

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this._hashPassword(password);
    const user = await this.usersService.create(
      {
        ...registerDto,
        password: hashedPassword,
      },
      avatar,
    );

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
    const hash = this._hashToken(refreshToken);
    await this.sessionsService.removeByHash(hash);
  }

  async refreshTokens(refreshToken: string) {
    const hashedToken = this._hashToken(refreshToken);

    const session = await this.sessionsService.findByHash(hashedToken);

    if (!session) {
      throw new ForbiddenException('Access Denied: Session not found');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionsService.removeByHash(hashedToken);
      throw new ForbiddenException('Access Denied: Token expired');
    }

    await this.sessionsService.removeByHash(hashedToken);

    const tokens = this._getAndSaveTokens(session.user);
    return tokens;
  }

  async validateOAuthUser(
    googleDto: Omit<RegisterDto, 'password'> & { avatar?: string },
  ) {
    const { email } = googleDto;
    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      return existingUser;
    }

    const hashedPassword = await bcrypt.hash(
      crypto.randomBytes(30).toString('base64'),
      10,
    );

    const userData = {
      ...googleDto,
      password: hashedPassword,
    };

    return await this.usersService.create(userData);
  }

  async loginOAuth({ email }: { email: string }) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this._getAndSaveTokens(user);
    return tokens;
  }

  private async _hashPassword(data: string) {
    return bcrypt.hash(data, 10);
  }

  private _hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async _getAndSaveTokens(user: User) {
    const rsaRefreshExpiresDays =
      this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS') ?? 7;
    const refreshExpiresAt = addDays(rsaRefreshExpiresDays);

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

    const refreshTokenHash = this._hashToken(refreshToken);

    await this.sessionsService.create({
      user,
      refreshTokenHash,
      expiresAt: refreshExpiresAt,
    });

    return { accessToken, refreshToken };
  }
}
