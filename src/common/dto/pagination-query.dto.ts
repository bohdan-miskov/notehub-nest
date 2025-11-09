import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  perPage: number = 10;
}
