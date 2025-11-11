import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { NoteTag } from '../enums/note-tag.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Homework',
    description: 'Note title',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @ApiProperty({
    example: 'I have to do exercise 1',
    description: 'Note content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: false,
    description: 'Note execution status',
  })
  @IsBoolean()
  @IsOptional()
  isDone?: boolean;

  @ApiProperty({
    example: NoteTag.Work,
    description: 'Note tag',
  })
  @IsEnum(NoteTag)
  @IsOptional()
  tag?: NoteTag;
}
