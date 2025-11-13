import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create(createSessionDto);
    return this.sessionRepository.save(session);
  }

  async findByHash(refreshTokenHash: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { refreshTokenHash },
      relations: ['user'],
    });
  }

  async removeByHash(refreshTokenHash: string): Promise<void> {
    await this.sessionRepository.delete({ refreshTokenHash });
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    await this.sessionRepository.delete({ user: { id: userId } });
  }
}
