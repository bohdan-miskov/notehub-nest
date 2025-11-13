import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { MockRepository } from 'src/common/types/mock.types';
import { Session } from './entities/session.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { addDays } from 'src/common/utils/addDays';
import { getRepositoryToken } from '@nestjs/typeorm';

function mockRepositoryFactory(): MockRepository<Session> {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function mockSessionFactory(props: Partial<Session>): Session {
  return {
    id: 1,
    user: { id: 1 } as User,
    refreshTokenHash: 'hash',
    expiresAt: addDays(7),
    createdAt: new Date(),
    ...props,
  };
}

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: MockRepository<Session>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: mockRepositoryFactory(),
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get<MockRepository<Session>>(
      getRepositoryToken(Session),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a session', async () => {
      const createDto: CreateSessionDto = {
        user: { id: 1 } as User,
        refreshTokenHash: 'tokenHash',
        expiresAt: addDays(7),
      };

      const createdSession = { ...createDto };
      repository.create?.mockReturnValue(createdSession);

      const savedSession = mockSessionFactory(createdSession);
      repository.save?.mockResolvedValue(savedSession);

      const result = await service.create(createDto);
      expect(result).toEqual(savedSession);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(createdSession);
    });
  });

  describe('findByHash', () => {
    it('should find a session by refreshTokenHash', async () => {
      const refreshTokenHash = 'tokenHash';
      const mockSession = mockSessionFactory({
        refreshTokenHash,
      });

      repository.findOne?.mockResolvedValue(mockSession);

      const result = await service.findByHash(refreshTokenHash);
      expect(result).toEqual(mockSession);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { refreshTokenHash },
        relations: ['user'],
      });
    });
  });

  describe('removeByHash', () => {
    it('should successfully remove a session by refreshTokenHash', async () => {
      const refreshTokenHash = 'tokenHash';

      const result = await service.removeByHash(refreshTokenHash);
      expect(result).toEqual(undefined);

      expect(repository.delete).toHaveBeenCalledWith({ refreshTokenHash });
    });
  });

  describe('deleteAllUserSessions', () => {
    it('should successfully deleted sessions by userId', async () => {
      const userId = 1;

      const result = await service.deleteAllUserSessions(userId);
      expect(result).toEqual(undefined);

      expect(repository.delete).toHaveBeenCalledWith({ user: { id: userId } });
    });
  });
});
