# ⚡ Quick Start Guide

## 🚀 Быстрый старт (5 минут)

### 1. Первая установка

```bash
# Одной командой!
make setup
```

Эта команда:
- ✅ Скопирует .env файлы
- ✅ Установит все зависимости
- ✅ Запустит PostgreSQL в Docker
- ✅ Настроит Prisma и миграции

### 2. Ежедневный запуск

```bash
# Запустить PostgreSQL
make up

# Запустить backend (в отдельном терминале)
make backend

# Запустить frontend (в отдельном терминале)
make frontend
```

### 3. Все команды Make

```bash
make help              # Показать все команды
make up                # Запустить PostgreSQL
make down              # Остановить PostgreSQL
make logs              # Показать логи
make restart           # Перезапустить PostgreSQL
make clean             # Очистить все (осторожно!)
make status            # Статус всех сервисов

make backend           # Запустить backend
make frontend          # Запустить frontend
make build             # Собрать backend + frontend

make prisma-studio     # Открыть Prisma Studio
make prisma-migrate    # Применить миграции
make prisma-reset      # Сбросить БД (осторожно!)

make pgadmin           # Запустить pgAdmin
make test-ai           # Тест AI endpoints
make test-backend      # Запустить backend тесты
```

## 🎯 Доступ к сервисам

После запуска:

- **Frontend (Editor)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Prisma Studio**: `make prisma-studio` → http://localhost:5555
- **pgAdmin** (опционально): `make pgadmin` → http://localhost:5050

## 🐛 Проблемы?

### PostgreSQL не запускается

```bash
# Остановить и пересоздать
make clean
make up
```

### Prisma ошибки

```bash
# Пересоздать БД
make prisma-reset
```

### Backend не подключается к БД

```bash
# Проверить статус
make status

# Проверить .env
cat back-end/.env

# Проверить подключение
make prisma-studio
```

## 📦 Что установлено?

### Docker Compose

- **PostgreSQL 16** на порту 5432
- **pgAdmin** на порту 5050 (опционально)
- Volume для данных (не потеряется при перезапуске)

### Backend (NestJS)

- REST API на порту 3000
- Prisma ORM
- AI endpoints готовы
- PostgreSQL подключена

### Frontend (Vue 3 + Tiptap)

- Vite dev server на порту 5173
- AI Chat интегрирован
- Markdown support
- BlockId extension

## 🔧 Настройка .env

Отредактируйте файлы если нужно:

```bash
# Корневой .env (для Docker)
nano .env

# Backend .env
nano back-end/.env
```

**Важные переменные:**

```bash
# PostgreSQL
POSTGRES_USER=journalist
POSTGRES_PASSWORD=journalist_pass
POSTGRES_DB=ai_journalist

# Backend
DATABASE_URL=postgresql://journalist:journalist_pass@localhost:5432/ai_journalist
AI_SERVICE_URL=http://localhost:5001
```

## 📚 Подробная документация

- [README_SETUP.md](./README_SETUP.md) - Полная инструкция
- [docs/AI_INTEGRATION.md](./docs/AI_INTEGRATION.md) - AI интеграция
- [back-end/README_AI.md](./back-end/README_AI.md) - Backend API

## 🎓 Примеры использования

### Создать новую сессию

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "media",
    "resourceId": "article-1",
    "title": "My First Article"
  }'
```

### Чат с AI

```bash
curl -X POST http://localhost:3000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "your-doc-id",
    "message": "Improve the introduction"
  }'
```

### Получить список документов

```bash
curl http://localhost:3000/documents
```

## 🐍 Python AI Service (опционально)

Если хотите запустить настоящий AI (пока работает в mock режиме):

```bash
# Создать venv
python -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Запустить AI service
python ai_journalist/api_server.py
```

## ✅ Проверка что все работает

```bash
# 1. Проверить статус
make status

# 2. Проверить PostgreSQL
docker-compose ps

# 3. Проверить backend
curl http://localhost:3000

# 4. Проверить AI endpoint (mock)
make test-ai

# 5. Открыть frontend
open http://localhost:5173
```

## 🎉 Готово!

Теперь:
1. Откройте http://localhost:5173
2. Создайте новую сессию
3. Начните писать статью
4. Используйте AI Chat для улучшений!

---

💡 **Tip**: Добавьте alias в ваш `.zshrc` или `.bashrc`:

```bash
alias journal-up="cd ~/Projects/ai-journalist && make up && make backend & make frontend &"
alias journal-down="cd ~/Projects/ai-journalist && make down && pkill -f 'nest start' && pkill -f 'vite'"
```

