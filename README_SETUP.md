# 🚀 AI Journalist - Setup Guide

Пошаговая инструкция по запуску проекта.

## 📋 Предварительные требования

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- Python 3.11+ (для AI service)

## 🛠️ Первоначальная настройка

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий (если еще не сделали)
cd /Users/mykhailokapustin/Projects/ai-journalist

# Установите зависимости для всех пакетов
pnpm install
```

### 2. Настройка Environment Variables

```bash
# Скопируйте .env.example
cp .env.example .env

# Отредактируйте .env файл, установите свои значения
nano .env

# Настройте backend .env
cd back-end
cp .env.example .env
nano .env
```

### 3. Запуск PostgreSQL через Docker

```bash
# В корневой папке проекта
docker-compose up -d postgres

# Проверить статус
docker-compose ps

# Логи
docker-compose logs -f postgres
```

**Опционально: запустить pgAdmin**
```bash
docker-compose --profile tools up -d pgadmin

# Доступ: http://localhost:5050
# Email: admin@journalist.local
# Password: admin
```

### 4. Настройка Prisma и миграции

```bash
cd back-end

# Генерация Prisma Client
pnpm prisma generate

# Запуск миграций
pnpm prisma migrate dev

# Проверка подключения
pnpm prisma studio
```

### 5. Запуск Backend

```bash
cd back-end

# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

Backend будет доступен на: `http://localhost:3000`

### 6. Запуск Frontend (Editor)

```bash
cd asrp-editor

# Development mode
pnpm run dev

# Build
pnpm run build
```

Frontend будет доступен на: `http://localhost:5173`

## 🐍 Python AI Service (опционально)

```bash
# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows

# Установить зависимости
pip install -r requirements.txt

# Запустить AI service
python ai_journalist/api_server.py
```

AI Service будет доступен на: `http://localhost:5001`

## 🔄 Ежедневный workflow

### Запуск всего проекта

```bash
# 1. Запустить PostgreSQL
docker-compose up -d postgres

# 2. Запустить Backend (в отдельном терминале)
cd back-end
pnpm run start:dev

# 3. Запустить Frontend (в отдельном терминале)
cd asrp-editor
pnpm run dev

# 4. (Опционально) Запустить AI Service
source venv/bin/activate
python ai_journalist/api_server.py
```

### Остановка

```bash
# Остановить Docker
docker-compose down

# Backend и Frontend - Ctrl+C в терминалах
```

## 📊 Полезные команды

### Docker

```bash
# Остановить все контейнеры
docker-compose down

# Остановить с удалением volumes (очистить БД)
docker-compose down -v

# Пересоздать контейнеры
docker-compose up -d --force-recreate

# Просмотр логов
docker-compose logs -f postgres
```

### Prisma

```bash
cd back-end

# Применить миграции
pnpm prisma migrate dev

# Сбросить БД (осторожно!)
pnpm prisma migrate reset

# Открыть Prisma Studio
pnpm prisma studio

# Обновить schema
pnpm prisma generate
```

### Backend

```bash
cd back-end

# Пересобрать
pnpm run build

# Запустить тесты
pnpm run test

# Линтер
pnpm run lint
```

### Frontend

```bash
cd asrp-editor

# Собрать для production
pnpm run build

# Preview production build
pnpm run preview

# Проверить типы
pnpm run type-check
```

## 🧪 Тестирование API

### Тест Backend Health

```bash
curl http://localhost:3000
```

### Тест AI Chat endpoint

```bash
curl -X POST http://localhost:3000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc",
    "message": "Improve the article"
  }'
```

### Тест Documents endpoint

```bash
# Список документов
curl http://localhost:3000/documents

# Создать сессию
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "media",
    "resourceId": "article-1",
    "title": "Test Article"
  }'
```

## 🐛 Troubleshooting

### PostgreSQL не запускается

```bash
# Проверить порт
lsof -i :5432

# Убить процесс если порт занят
kill -9 <PID>

# Пересоздать контейнер
docker-compose down -v
docker-compose up -d postgres
```

### Prisma ошибки

```bash
# Очистить и пересоздать
cd back-end
rm -rf node_modules/.prisma
pnpm prisma generate
pnpm prisma migrate reset
```

### Backend не подключается к БД

1. Проверьте `DATABASE_URL` в `back-end/.env`
2. Убедитесь что PostgreSQL запущен: `docker-compose ps`
3. Проверьте логи: `docker-compose logs postgres`

### Frontend не подключается к Backend

1. Проверьте `VITE_API_URL` в `asrp-editor/.env`
2. Убедитесь что backend запущен на порту 3000
3. Проверьте CORS настройки в backend

## 📁 Структура проекта

```
ai-journalist/
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── .env                        # Environment variables
├── back-end/                   # NestJS Backend
│   ├── src/
│   │   ├── ai/                # AI endpoints
│   │   ├── documents/         # Document management
│   │   ├── sessions/          # Session management
│   │   └── prisma/            # Database
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env
├── asrp-editor/               # Vue 3 Frontend
│   ├── src/
│   │   ├── components/        # Vue components
│   │   ├── extensions/        # Tiptap extensions
│   │   └── utils/            # Utilities
│   └── .env
├── ai_journalist/             # Python AI Service
│   ├── agent.py
│   ├── runner.py
│   └── api_server.py
└── docs/                      # Documentation
    ├── AI_INTEGRATION.md
    └── flow.md
```

## 🔐 Security

⚠️ **Важно для production:**

1. Измените все пароли в `.env`
2. Используйте сильные пароли
3. Не коммитьте `.env` файлы в git
4. Настройте CORS правильно
5. Добавьте rate limiting
6. Используйте HTTPS

## 📚 Документация

- [AI Integration](./docs/AI_INTEGRATION.md) - Полная документация по AI
- [Backend README](./back-end/README_AI.md) - Backend API документация
- [Flow Diagram](./docs/flow.md) - Диаграммы работы системы

## 🤝 Contributing

1. Создайте feature branch
2. Сделайте изменения
3. Запустите тесты
4. Создайте Pull Request

## 📞 Support

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs`
2. Проверьте `.env` файлы
3. Пересоздайте контейнеры: `docker-compose down -v && docker-compose up -d`

