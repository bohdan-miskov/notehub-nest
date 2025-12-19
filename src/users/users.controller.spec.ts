import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MockService } from 'src/common/types/mock.types';
import { User } from './entities/user.entity';
import { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';

function mockServiceFactory<T extends object>(): MockService<T> {
  return {
    findOne: jest.fn(),
    update: jest.fn(),
  } as MockService<T>;
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

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: MockService<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockServiceFactory<UsersService>(),
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    mockUsersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return current user', async () => {
      const userId = 1;
      const mockRequest = {
        user: {
          id: userId,
        },
      } as Request;
      const mockUser = mockUserFactory({
        id: userId,
      });

      mockUsersService.findOne?.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockRequest);
      expect(result).toEqual(mockUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
    });
  });
  describe('update', () => {
    it('should successfully update current user', async () => {
      const updateDto: UpdateUserDto = {
        name: 'newUser',
      };
      const userId = 1;
      const mockRequest = {
        user: {
          id: userId,
          ...updateDto,
        },
      } as Request;

      const mockUser = mockUserFactory({
        id: userId,
      });
      mockUsersService.update?.mockResolvedValue(mockUser);

      const result = await controller.update(updateDto, mockRequest);
      expect(result).toEqual(mockUser);

      expect(mockUsersService.update).toHaveBeenCalledWith(userId, updateDto);
    });
  });
});
