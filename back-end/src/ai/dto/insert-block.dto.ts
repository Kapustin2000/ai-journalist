import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class InsertBlockDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  insertAfter: string;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsOptional()
  context?: string;
}

