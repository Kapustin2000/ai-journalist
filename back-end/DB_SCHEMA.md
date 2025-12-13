# Database Schema

## Core Models

### Document
Main document storage with content, status, and metadata.

### DocumentHistory
Version history for documents - snapshots of content at save points.

### DocumentUpdate
Pending changes queue - AI suggestions waiting for user approval.

## AI Models

### AiOperation
Tracks all AI operations (rewrite, insert, improve, chat).
- Stores input/output
- Tracks processing time and tokens
- Status: pending → processing → completed/failed

### AiChatMessage
Individual chat messages in AI conversations.
- Links to session and document
- Stores role (user/assistant/system)
- Includes metadata (selectedBlockId, updates)

### AiSession
Chat session management.
- Groups messages by document
- Tracks activity and message count
- Stores session context

## Indexes

```sql
-- Performance indexes
AiOperation: documentId, status, createdAt
AiChatMessage: sessionId, documentId, createdAt
AiSession: documentId, userId, lastActiveAt
```

## Usage

```typescript
// Track AI operation
const operation = await prisma.aiOperation.create({
  data: {
    documentId: 'doc-123',
    type: 'rewrite',
    status: 'pending',
    input: { blockId, instruction, content },
  },
});

// Create chat session
const session = await prisma.aiSession.create({
  data: {
    documentId: 'doc-123',
    metadata: { context: 'article editing' },
  },
});

// Save chat message
await prisma.aiChatMessage.create({
  data: {
    sessionId: session.id,
    documentId: 'doc-123',
    role: 'user',
    content: 'Improve this paragraph',
  },
});
```

## Migration

```bash
# Generate Prisma client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name add_ai_tables

# Apply to production
pnpm prisma migrate deploy
```

