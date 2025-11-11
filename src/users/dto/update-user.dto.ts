import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Bohdan',
    description: "User's first name",
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
