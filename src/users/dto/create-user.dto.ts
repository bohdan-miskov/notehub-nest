import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Bohdan',
    description: "User's first name",
  })
  name: string;

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
