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
}
