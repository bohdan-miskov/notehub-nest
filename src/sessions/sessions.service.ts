import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(
    user: User,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      user,
      refreshTokenHash,
      expiresAt,
    });
    return this.sessionRepository.save(session);
  }

  async findSessionByHash(refreshTokenHash: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { refreshTokenHash },
      relations: ['user'],
    });
  }

  async deleteSession(refreshTokenHash: string): Promise<void> {
    await this.sessionRepository.delete({ refreshTokenHash });
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    await this.sessionRepository.delete({ user: { id: userId } });
  }
}
