import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Bohdan',
    description: "User's first name",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The unique email of the user',
  })
  @ApiPropertyOptional({
    example: 'https://gallery/avatar1.jpg',
    description: "User's avatar url",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    description: 'User password (at least 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
