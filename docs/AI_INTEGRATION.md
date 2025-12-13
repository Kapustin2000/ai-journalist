# AI Integration Architecture

## 1. О формате данных

### Markdown vs HTML
**Текущий формат**: Редактор работает с **Markdown** через Tiptap StarterKit.
- Tiptap конвертирует Markdown ↔ HTML ↔ JSON автоматически
- Сохраняется в БД как JSON (ProseMirror format)
- AI работает с Markdown для лучшей читаемости

### Структура документа
```typescript
{
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { blockId: 'block_a1b2c3d4' },  // ← Уникальный ID блока
      content: [{ type: 'text', text: 'Текст параграфа...' }]
    },
    {
      type: 'heading',
      attrs: { level: 2, blockId: 'block_e5f6g7h8' },
      content: [{ type: 'text', text: 'Заголовок' }]
    }
  ]
}
```

---

## 2. Архитектура интеграции AI

### 2.1 Общая схема

```mermaid
graph TB
    Editor[Editor Frontend<br/>Vue + Tiptap] 
    Backend[NestJS Backend<br/>PostgreSQL]
    AIService[AI Service<br/>Google ADK]
    
    Editor -->|1. Save Document| Backend
    Editor -->|2. Request AI Edit| Backend
    Backend -->|3. Forward to AI| AIService
    AIService -->|4. Generate Updates| Backend
    Backend -->|5. Store Updates| Database[(PostgreSQL)]
    Backend -->|6. Notify Editor| Editor
    Editor -->|7. Preview/Apply| Editor
```

### 2.2 Основные концепции

#### **Block-Level AI Operations**
Каждый блок в редакторе имеет уникальный `blockId`:
- Генерируется при создании блока
- Сохраняется в `attrs` узла Tiptap
- Используется для точечной работы AI с контентом

#### **Update Queue Pattern**
AI не изменяет документ напрямую, а создает **очередь обновлений**:
```typescript
interface DocumentUpdate {
  id: string;
  documentId: string;
  type: 'insert' | 'rewrite' | 'delete';
  payload: {
    blockId?: string;           // Целевой блок
    content?: string;           // Новый контент
    insertAfter?: string;       // Для вставки
    position?: number;          // Позиция в документе
  };
  state: 'pending' | 'applied' | 'rejected';
  note?: string;                // Пояснение от AI
  createdAt: DateTime;
}
```

#### **State Synchronization**
```typescript
// Состояние на бэкенде
Document {
  id: string;
  content: Json;                // Текущее содержимое
  pendingUpdates: Update[];     // Очередь изменений от AI
  history: History[];           // История всех версий
}
```

---

## 3. Backend API Endpoints

### 3.1 Существующие endpoints

```typescript
// Работа с документами
GET    /documents/:id                  // Получить документ
POST   /documents/:id/save             // Сохранить изменения
GET    /documents/:id/history          // История версий

// Работа с AI Updates
GET    /documents/:id/updates          // Получить pending updates
POST   /documents/:id/updates/apply    // Применить update(s)
POST   /documents/:id/updates/reject   // Отклонить update(s)
DELETE /documents/:id/updates          // Очистить все updates
```

### 3.2 Новые endpoints для AI

```typescript
// AI Operations
POST   /ai/rewrite-block               // Переписать блок
POST   /ai/insert-block                // Вставить новый блок
POST   /ai/improve-article             // Улучшить всю статью
POST   /ai/chat                        // Чат с AI о документе

// AI Status
GET    /ai/status/:documentId          // Статус AI обработки
```

---

## 4. Детальный Flow интеграции

### 4.1 Markup Blocks (Подготовка для AI)

**1. Пользователь открывает документ в редакторе**

**2. Editor добавляет blockId к каждому блоку:**
```typescript
// В DocumentEditor.vue
const addBlockIds = (doc: any) => {
  doc.descendants((node: any, pos: number) => {
    if (node.isBlock && !node.attrs.blockId) {
      node.attrs.blockId = `block_${uuid()}`;
    }
  });
  return doc;
};
```

**3. При сохранении отправляется JSON с blockId:**
```json
{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2, "blockId": "block_a1b2c3d4" },
        "content": [{ "type": "text", "text": "Введение" }]
      },
      {
        "type": "paragraph",
        "attrs": { "blockId": "block_e5f6g7h8" },
        "content": [{ "type": "text", "text": "Текст параграфа..." }]
      }
    ]
  }
}
```

### 4.2 AI Edit Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Backend
    participant AI
    participant DB
    
    User->>Editor: Выделяет блок, просит AI переписать
    Editor->>Backend: POST /ai/rewrite-block<br/>{blockId, instruction}
    Backend->>DB: Загружает документ с blockId
    Backend->>AI: Отправляет контекст + инструкцию
    AI->>AI: Генерирует новый контент
    AI-->>Backend: Возвращает новый текст + пояснение
    Backend->>DB: Создает DocumentUpdate (pending)
    Backend-->>Editor: Возвращает update
    Editor->>Editor: Показывает превью изменений
    User->>Editor: Применить / Отклонить
    Editor->>Backend: POST /documents/:id/updates/apply
    Backend->>DB: Обновляет document.content
    Backend-->>Editor: Возвращает обновленный документ
```

### 4.3 Implementation: Backend AI Controller

```typescript
// back-end/src/ai/ai.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

interface RewriteBlockDto {
  documentId: string;
  blockId: string;
  instruction: string;
  context?: string;  // Опционально: контекст соседних блоков
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('rewrite-block')
  async rewriteBlock(@Body() dto: RewriteBlockDto) {
    return this.aiService.rewriteBlock(dto);
  }

  @Post('insert-block')
  async insertBlock(@Body() dto: {
    documentId: string;
    insertAfter: string;  // blockId
    instruction: string;
  }) {
    return this.aiService.insertBlock(dto);
  }

  @Post('chat')
  async chat(@Body() dto: {
    documentId: string;
    message: string;
    selectedBlockId?: string;
  }) {
    return this.aiService.chat(dto);
  }
}
```

### 4.4 Implementation: AI Service

```typescript
// back-end/src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async rewriteBlock(dto: {
    documentId: string;
    blockId: string;
    instruction: string;
  }) {
    // 1. Получаем документ
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // 2. Находим блок по blockId
    const content = document.content as any;
    const block = this.findBlockById(content, dto.blockId);

    if (!block) {
      throw new Error('Block not found');
    }

    // 3. Конвертируем в Markdown для AI
    const markdown = this.convertToMarkdown(block);

    // 4. Вызываем Python AI скрипт
    const aiResponse = await this.callPythonAI({
      operation: 'rewrite',
      blockId: dto.blockId,
      content: markdown,
      instruction: dto.instruction,
      context: this.getBlockContext(content, dto.blockId),
    });

    // 5. Создаем DocumentUpdate (pending)
    const update = await this.prisma.documentUpdate.create({
      data: {
        documentId: dto.documentId,
        type: 'rewrite',
        payload: {
          blockId: dto.blockId,
          content: aiResponse.newContent,
          oldContent: markdown,
        },
        state: 'pending',
        note: aiResponse.note || 'AI rewrite suggestion',
      },
    });

    return {
      updateId: update.id,
      preview: aiResponse.newContent,
      note: aiResponse.note,
    };
  }

  private async callPythonAI(params: any): Promise<any> {
    // Вызов Python скрипта через API или subprocess
    const command = `python3 ai_journalist/runner.py rewrite \
      --block-id "${params.blockId}" \
      --content "${params.content}" \
      --instruction "${params.instruction}"`;

    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  }

  private findBlockById(content: any, blockId: string): any {
    // Рекурсивный поиск блока по blockId
    const find = (node: any): any => {
      if (node.attrs?.blockId === blockId) {
        return node;
      }
      if (node.content) {
        for (const child of node.content) {
          const found = find(child);
          if (found) return found;
        }
      }
      return null;
    };
    return find(content);
  }

  private getBlockContext(content: any, blockId: string): string {
    // Получаем соседние блоки для контекста
    // ...
    return '';
  }

  private convertToMarkdown(block: any): string {
    // Конвертация ProseMirror JSON в Markdown
    // Можно использовать tiptap или prosemirror-markdown
    return '';
  }
}
```

---

## 5. Frontend Integration

### 5.1 AI Chat Component

Создадим компонент чата для работы с AI:

```vue
<!-- asrp-editor/src/components/AiChat.vue -->
<template>
  <div class="ai-chat">
    <div class="chat-header">
      <h3>🤖 AI Ассистент</h3>
      <button @click="$emit('close')" class="ghost">×</button>
    </div>

    <div class="chat-messages" ref="messagesRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div class="message-content">{{ msg.content }}</div>
        <div v-if="msg.updates" class="message-updates">
          <button
            v-for="update in msg.updates"
            :key="update.id"
            @click="applyUpdate(update)"
            class="update-btn"
          >
            Применить изменение в блоке {{ update.payload.blockId }}
          </button>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="Спросите AI об улучшениях..."
      />
      <button @click="sendMessage" class="primary">Отправить</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  updates?: any[];
}

const props = defineProps<{
  documentId: string;
  selectedBlockId?: string;
}>();

const emit = defineEmits<{
  close: [];
  'apply-update': [update: any];
}>();

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const messagesRef = ref<HTMLElement>();

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  // Добавляем сообщение пользователя
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
  });

  const userMessage = inputMessage.value;
  inputMessage.value = '';

  // Отправляем на бэкенд
  const response = await api.post('/ai/chat', {
    documentId: props.documentId,
    message: userMessage,
    selectedBlockId: props.selectedBlockId,
  });

  // Добавляем ответ AI
  messages.value.push({
    id: response.id,
    role: 'assistant',
    content: response.message,
    updates: response.updates || [],
  });

  // Скроллим вниз
  setTimeout(() => {
    messagesRef.value?.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: 'smooth',
    });
  }, 100);
};

const applyUpdate = (update: any) => {
  emit('apply-update', update);
};
</script>

<style scoped>
.ai-chat {
  @apply flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl;
}

.chat-header {
  @apply flex items-center justify-between p-4 border-b border-slate-800;
}

.chat-messages {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.message {
  @apply p-3 rounded-lg;
}

.message.user {
  @apply bg-sky-500/20 ml-8;
}

.message.assistant {
  @apply bg-slate-800 mr-8;
}

.chat-input {
  @apply flex gap-2 p-4 border-t border-slate-800;
}

.update-btn {
  @apply mt-2 text-sm bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded;
}
</style>
```

### 5.2 Добавление в DocumentEditor

```vue
<!-- asrp-editor/src/components/DocumentEditor.vue -->
<template>
  <div v-if="document" class="editor-container">
    <!-- Existing content -->
    
    <aside class="sidebar">
      <!-- ... существующие секции ... -->
      
      <!-- Новая секция: AI Chat -->
      <section v-if="showAiChat" class="sidebar-card">
        <AiChat
          :document-id="document.id"
          :selected-block-id="selectedBlockId"
          @close="showAiChat = false"
          @apply-update="handleAiUpdate"
        />
      </section>
      
      <button
        v-else
        @click="showAiChat = true"
        class="primary w-full"
      >
        🤖 Открыть AI Ассистент
      </button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import AiChat from './AiChat.vue';

const showAiChat = ref(false);
const selectedBlockId = ref<string | null>(null);

const handleAiUpdate = async (update: any) => {
  // Применить update к редактору
  await api.post(`/documents/${document.id}/updates/apply`, {
    updateIds: [update.id],
  });
  
  // Обновить контент редактора
  await loadDocument();
};
</script>
```

---

## 6. Python AI Service Integration

### 6.1 API Wrapper для AI Journalist

```python
# ai_journalist/api_server.py
from flask import Flask, request, jsonify
from ai_journalist.runner import process_article
from ai_journalist.tools.markup_blocks import markup_article_blocks

app = Flask(__name__)

@app.route('/api/v1/rewrite-block', methods=['POST'])
def rewrite_block():
    """
    Переписать конкретный блок статьи
    """
    data = request.json
    block_id = data.get('blockId')
    content = data.get('content')
    instruction = data.get('instruction')
    context = data.get('context', '')
    
    # Формируем промпт для AI
    prompt = f"""
    Rewrite the following block according to this instruction: {instruction}
    
    Context (surrounding blocks):
    {context}
    
    Block to rewrite:
    {content}
    
    Return only the rewritten content, maintaining the same block type.
    """
    
    # Вызываем AI через ADK Runner
    result = process_article(prompt)
    
    return jsonify({
        'newContent': result.get('response_text', ''),
        'note': 'AI rewrite based on instruction',
        'blockId': block_id
    })

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    """
    Чат с AI о документе
    """
    data = request.json
    document_content = data.get('documentContent')
    message = data.get('message')
    selected_block_id = data.get('selectedBlockId')
    
    # Markup blocks if not already done
    markup_result = markup_article_blocks(document_content, None)
    blocks = markup_result.get('blocks', [])
    
    # Формируем контекст для AI
    context = f"Document has {len(blocks)} blocks.\n"
    if selected_block_id:
        selected_block = next((b for b in blocks if b['id'] == selected_block_id), None)
        if selected_block:
            context += f"\nSelected block: {selected_block['content']}\n"
    
    prompt = f"{context}\nUser: {message}\n\nPlease provide suggestions."
    
    result = process_article(prompt)
    
    return jsonify({
        'id': str(uuid.uuid4()),
        'message': result.get('response_text', ''),
        'updates': result.get('pending_updates', [])
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
```

### 6.2 Запуск AI Service

```bash
# В docker-compose.yml добавляем AI service
services:
  ai-service:
    build:
      context: .
      dockerfile: Dockerfile.ai
    ports:
      - "5001:5001"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    volumes:
      - ./ai_journalist:/app/ai_journalist
```

---

## 7. Deployment & Configuration

### 7.1 Environment Variables

```bash
# back-end/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/journalist"
AI_SERVICE_URL="http://localhost:5001"
GOOGLE_API_KEY="your_google_adk_key"
```

### 7.2 NestJS Configuration

```typescript
// back-end/src/config/ai.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001',
  apiKey: process.env.GOOGLE_API_KEY,
  timeout: 30000, // 30 seconds
}));
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// back-end/src/ai/ai.service.spec.ts
describe('AiService', () => {
  it('should create pending update for rewrite operation', async () => {
    const result = await aiService.rewriteBlock({
      documentId: 'doc-1',
      blockId: 'block_abc',
      instruction: 'Make it shorter',
    });
    
    expect(result.updateId).toBeDefined();
    expect(result.preview).toBeDefined();
  });
});
```

### 8.2 E2E Tests

```typescript
// asrp-editor/cypress/e2e/ai-integration.cy.ts
describe('AI Integration', () => {
  it('should apply AI suggestion to block', () => {
    cy.visit('/editor/doc-1');
    cy.get('[data-block-id="block_abc"]').click();
    cy.get('.ai-chat-toggle').click();
    cy.get('.chat-input input').type('Сделай короче{enter}');
    cy.get('.update-btn').first().click();
    cy.get('[data-block-id="block_abc"]').should('contain', 'updated text');
  });
});
```

---

## 9. Roadmap

### Phase 1: Basic Integration ✅
- [ ] Block IDs в Tiptap
- [ ] Backend AI endpoints
- [ ] Python AI service wrapper
- [ ] Базовый AI Chat component

### Phase 2: Advanced Features
- [ ] Real-time collaboration
- [ ] Batch operations (улучшить всю статью)
- [ ] AI suggestions в режиме реального времени
- [ ] История AI правок

### Phase 3: Production Ready
- [ ] Rate limiting
- [ ] Caching
- [ ] Error handling & retry logic
- [ ] Analytics & monitoring

---

## 10. Security Considerations

1. **API Rate Limiting**: Ограничить количество AI запросов на пользователя
2. **Content Validation**: Проверять контент перед отправкой в AI
3. **Authentication**: Токены для доступа к AI endpoints
4. **Cost Control**: Мониторинг использования Google ADK API

---

## Заключение

Эта архитектура обеспечивает:
✅ **Block-level AI operations** - работа с каждым блоком отдельно  
✅ **Update queue pattern** - безопасное применение изменений  
✅ **Real-time sync** - синхронизация через backend  
✅ **Scalability** - легко добавлять новые AI операции  
✅ **User control** - пользователь контролирует все изменения  

Следующий шаг: начнем с реализации базовых endpoints и AI Chat компонента! 🚀

