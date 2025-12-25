import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly filesService: FilesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<User> {
    const updateData: Partial<User> = { id, ...updateUserDto };
    if (avatar) {
      updateData.avatar = await this.filesService.uploadFile(avatar);
    }
    const user = await this.userRepository.preload(updateData);

    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    return this.userRepository.save(user);
  }
}
