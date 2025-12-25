import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Bohdan',
    description: "User's first name",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
  @ApiPropertyOptional({
    example: 'https://gallery/avatar1.jpg',
    description: "User's avatar url",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatar?: string;
}
