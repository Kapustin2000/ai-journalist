# AI Integration Backend

Backend API для интеграции AI в редактор статей.

## 🚀 Структура

```
back-end/src/
├── ai/
│   ├── ai.module.ts          # AI модуль
│   ├── ai.controller.ts      # AI endpoints
│   ├── ai.service.ts         # Бизнес-логика AI
│   └── dto/
│       ├── rewrite-block.dto.ts
│       ├── insert-block.dto.ts
│       └── chat.dto.ts
├── prisma/
│   ├── prisma.module.ts      # Prisma модуль
│   └── prisma.service.ts     # Prisma сервис
└── app.module.ts             # Главный модуль
```

## 📡 AI Endpoints

### 1. POST `/ai/rewrite-block`
Переписать конкретный блок статьи

**Request:**
```json
{
  "documentId": "doc-123",
  "blockId": "block_a1b2c3d4",
  "instruction": "Make it more concise",
  "context": "Optional context from surrounding blocks"
}
```

**Response:**
```json
{
  "updateId": "update-456",
  "preview": "Rewritten content...",
  "note": "AI rewrite suggestion"
}
```

### 2. POST `/ai/insert-block`
Вставить новый блок после указанного

**Request:**
```json
{
  "documentId": "doc-123",
  "insertAfter": "block_a1b2c3d4",
  "instruction": "Add introduction paragraph",
  "context": "Optional context"
}
```

**Response:**
```json
{
  "updateId": "update-789",
  "preview": "New content...",
  "note": "AI insert suggestion"
}
```

### 3. POST `/ai/chat`
Чат с AI о документе

**Request:**
```json
{
  "documentId": "doc-123",
  "message": "Improve the conclusion",
  "selectedBlockId": "block_xyz" // optional
}
```

**Response:**
```json
{
  "id": "chat_1234567890",
  "message": "I'll help you improve the conclusion...",
  "updates": [
    {
      "id": "update-abc",
      "type": "rewrite",
      "payload": {...},
      "note": "Improved conclusion"
    }
  ]
}
```

### 4. POST `/ai/improve-article`
Улучшить всю статью

**Request:**
```json
{
  "documentId": "doc-123"
}
```

**Response:**
```json
{
  "message": "Article improved successfully",
  "updates": [...]
}
```

## 🔧 Настройка

### 1. Environment Variables

Создайте `.env` файл:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/journalist"

# AI Service
AI_SERVICE_URL="http://localhost:5001"

# Server
PORT=3000
```

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Prisma Setup

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed
```

### 4. Запуск

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## 🧪 Тестирование

### Тест AI Chat endpoint:

```bash
curl -X POST http://localhost:3000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "your-doc-id",
    "message": "Improve the article"
  }'
```

### Тест Rewrite Block:

```bash
curl -X POST http://localhost:3000/ai/rewrite-block \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "your-doc-id",
    "blockId": "block_abc123",
    "instruction": "Make it shorter"
  }'
```

## 🔄 Workflow

1. **Frontend** отправляет запрос на AI endpoint
2. **Backend** получает документ из БД
3. **Backend** находит нужный блок по `blockId`
4. **Backend** отправляет запрос в **Python AI Service**
5. **Python AI Service** обрабатывает через Google ADK
6. **Backend** создает `DocumentUpdate` (pending)
7. **Frontend** получает preview и может применить/отклонить

## 🐍 Python AI Service

Backend ожидает Python AI Service на `http://localhost:5001` со следующими endpoints:

- `POST /api/v1/rewrite-block`
- `POST /api/v1/insert-block`
- `POST /api/v1/chat`
- `POST /api/v1/improve-article`

### Fallback Mode

Если Python AI Service недоступен, backend создает **mock responses** для демонстрации работы UI.

## 📊 Database Schema

```prisma
model DocumentUpdate {
  id         String      @id @default(uuid())
  document   Document    @relation(...)
  documentId String
  type       String      // 'rewrite' | 'insert' | 'delete'
  payload    Json        // { blockId, content, ... }
  state      UpdateState @default(pending)
  note       String?
  createdAt  DateTime    @default(now())
  resolvedAt DateTime?
}

enum UpdateState {
  pending
  applied
  rejected
}
```

## 🛠️ Helper Methods в AiService

- `findBlockById(content, blockId)` - найти блок по ID
- `blockToText(block)` - конвертировать блок в текст
- `getBlockContext(content, blockId)` - получить контекст вокруг блока
- `getDocumentInfo(content)` - получить информацию о документе

## 🔐 Security

- [ ] TODO: Добавить rate limiting
- [ ] TODO: Добавить authentication
- [ ] TODO: Добавить request validation
- [ ] TODO: Добавить CORS configuration

## 📝 Next Steps

1. Создать Python AI Service (Flask/FastAPI)
2. Интегрировать Google ADK
3. Добавить WebSocket для real-time updates
4. Добавить caching для AI responses
5. Добавить analytics и monitoring

## 🐛 Troubleshooting

### AI Service не отвечает
- Проверьте `AI_SERVICE_URL` в `.env`
- Убедитесь что Python service запущен
- Backend будет использовать mock responses

### Prisma ошибки
```bash
pnpm prisma generate
pnpm prisma migrate reset
```

### TypeScript ошибки
```bash
pnpm run build
```

## 📚 Документация

Полная документация по AI интеграции: `/docs/AI_INTEGRATION.md`

