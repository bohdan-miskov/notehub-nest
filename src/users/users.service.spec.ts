import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { MockRepository } from 'src/common/types/mock.types';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

function mockRepositoryFactory(): MockRepository<User> {
  return {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
  };
}

function mockUserFactory(props: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'testUser',
    email: 'test@example.com',
    password: '$2b$10$C8iH2iwkHWPbD7CMer/ruOmOGRcMmdSmzA3thShgNO97fGbnd93pW',
    notes: [],
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositoryFactory(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create user', async () => {
      const createDto: CreateUserDto = {
        name: 'TestUser',
        email: 'example@test.com',
        password: '12345678',
      };

      const createdUser = createDto;
      repository.create?.mockReturnValue(createdUser);

      const savedUser = mockUserFactory(createdUser);
      repository.save?.mockResolvedValue(savedUser);

      const result = await service.create(createDto);
      expect(result).toEqual(savedUser);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(createdUser);
    });
  });
  describe('findOne', () => {
    it('should find a user by id', async () => {
      const userId = 1;
      const mockUser = mockUserFactory({ id: userId });

      repository.findOneBy?.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(result).toEqual(mockUser);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: userId });
    });
    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const mockUser = null;

      repository.findOneBy?.mockResolvedValue(mockUser);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: userId });
    });
  });
  describe('findOneByEmail', () => {
    it('should find a user by email', async () => {
      const userEmail = 'test@example.com';
      const mockUser = mockUserFactory({ email: userEmail });

      repository.findOneBy?.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail(userEmail);

      expect(result).toEqual(mockUser);

      expect(repository.findOneBy).toHaveBeenCalledWith({ email: userEmail });
    });
    it('should return null if user not found', async () => {
      const userEmail = 'notFound.example.com';
      const mockUser = null;

      repository.findOneBy?.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail(userEmail);

      expect(result).toEqual(mockUser);

      expect(repository.findOneBy).toHaveBeenCalledWith({ email: userEmail });
    });
  });
  describe('update', () => {
    it('should successfully update a user', async () => {
      const userId = 1;

      const updateDto: UpdateUserDto = {
        name: 'updatedName',
      };
      const updatedUser = {
        id: userId,
        name: 'Test',
        email: 'test@example.com',
        password: 'PaSsWoRd',
        ...updateDto,
      };

      repository.preload?.mockResolvedValue(updatedUser);

      const savedUser = mockUserFactory(updatedUser);
      repository.save?.mockResolvedValue(savedUser);

      const result = await service.update(userId, updateDto);

      expect(result).toEqual(savedUser);

      expect(repository.preload).toHaveBeenCalledWith({
        id: userId,
        ...updateDto,
      });
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
    });
    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const mockUser = undefined;

      repository.preload?.mockResolvedValue(mockUser);

      const updateDto: UpdateUserDto = {
        name: 'updatedName',
      };

      await expect(service.update(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.preload).toHaveBeenCalledWith({
        id: userId,
        ...updateDto,
      });
    });
  });
});
