import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { NoteTag } from '../enums/note-tag.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/sort-order.enum';

enum SortBy {
  Id = 'id',
  Title = 'title',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export class QueryNoteDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(NoteTag)
  tag?: NoteTag;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDone?: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.Id;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
