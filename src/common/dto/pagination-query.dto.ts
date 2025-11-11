import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Number of page',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Count of elements in page',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  perPage: number = 10;
}
