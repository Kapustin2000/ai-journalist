import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class RewriteBlockDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  blockId: string;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsString()
  @IsOptional()
  context?: string;
}

