export class CreateSessionDto {
  projectId: string;
  resourceId: string;
  title?: string;
  blocks?: any[];
  metadata?: Record<string, any>;
}

