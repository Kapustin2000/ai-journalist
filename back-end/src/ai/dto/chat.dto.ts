import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  selectedBlockId?: string;
}

