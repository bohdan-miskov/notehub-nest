import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { NoteTag } from '../enums/note-tag.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortBy {
  Id = 'id',
  Title = 'title',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export class QueryNoteDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'english',
    description: 'Searchable content in note title or content',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: NoteTag.Work,
    description: 'Note tag for filtering',
  })
  @IsOptional()
  @IsEnum(NoteTag)
  tag?: NoteTag;

  @ApiPropertyOptional({
    example: false,
    description: 'Note execution status for filtering',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDone?: boolean;

  @ApiPropertyOptional({
    example: SortBy.Title,
    description: 'Sorting note field name',
  })
  @IsOptional()
  @IsString()
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.Id;

  @ApiPropertyOptional({
    example: SortOrder.ASC,
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
