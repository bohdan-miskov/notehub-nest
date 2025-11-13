import { User } from 'src/users/entities/user.entity';

export class CreateSessionDto {
  user: User;
  refreshTokenHash: string;
  expiresAt: Date;
}
