import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Bohdan',
    description: "User's first name",
  })
  name: string;

  @ApiPropertyOptional({
    example: 'https://gallery/avatar1.jpg',
    description: "User's avatar url",
  })
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The unique email of the user',
  })
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    description: 'User password (at least 8 characters)',
  })
  password: string;
}
