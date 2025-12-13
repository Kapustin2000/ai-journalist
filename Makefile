.PHONY: help setup up down logs clean restart dev

help: ## Показать эту помощь
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Первоначальная настройка проекта
	@echo "🚀 Настройка проекта..."
	@cp -n .env.example .env || true
	@cp -n back-end/.env.example back-end/.env || true
	@echo "📦 Установка зависимостей..."
	@pnpm install
	@echo "🐘 Запуск PostgreSQL..."
	@docker-compose up -d postgres
	@echo "⏳ Ждем запуска PostgreSQL..."
	@sleep 5
	@echo "🗄️ Настройка Prisma..."
	@cd back-end && pnpm prisma generate && pnpm prisma migrate dev
	@echo "✅ Настройка завершена!"

up: ## Запустить PostgreSQL
	@echo "🐘 Запуск PostgreSQL..."
	@docker-compose up -d postgres

down: ## Остановить PostgreSQL
	@echo "🛑 Остановка PostgreSQL..."
	@docker-compose down

logs: ## Показать логи PostgreSQL
	@docker-compose logs -f postgres

clean: ## Очистить все (включая volumes)
	@echo "🧹 Очистка..."
	@docker-compose down -v
	@rm -rf back-end/node_modules/.prisma
	@echo "✅ Очистка завершена"

restart: ## Перезапустить PostgreSQL
	@echo "🔄 Перезапуск PostgreSQL..."
	@docker-compose restart postgres

dev: ## Запустить весь проект в dev режиме
	@echo "🚀 Запуск проекта..."
	@make up
	@echo "📦 Запуск backend..."
	@cd back-end && pnpm run start:dev &
	@echo "🎨 Запуск frontend..."
	@cd asrp-editor && pnpm run dev &
	@echo "✅ Проект запущен!"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"

backend: ## Запустить только backend
	@cd back-end && pnpm run start:dev

frontend: ## Запустить только frontend
	@cd asrp-editor && pnpm run dev

prisma-studio: ## Открыть Prisma Studio
	@cd back-end && pnpm prisma studio

prisma-migrate: ## Применить миграции Prisma
	@cd back-end && pnpm prisma migrate dev

prisma-reset: ## Сбросить БД (осторожно!)
	@cd back-end && pnpm prisma migrate reset

build: ## Собрать backend и frontend
	@echo "🔨 Сборка backend..."
	@cd back-end && pnpm run build
	@echo "🔨 Сборка frontend..."
	@cd asrp-editor && pnpm run build
	@echo "✅ Сборка завершена!"

test-backend: ## Тестировать backend
	@cd back-end && pnpm run test

ai-service: ## Запустить AI service
	@./run_ai_service.sh

view-ai-logs: ## Показать информацию о логах AI service
	@./view_logs.sh

test-ai: ## Тест AI endpoints
	@echo "🧪 Testing AI Chat..."
	@curl -X POST http://localhost:3000/ai/chat \
		-H "Content-Type: application/json" \
		-d '{"documentId":"test","message":"improve article"}' | jq .

test-ai-direct: ## Test AI service directly
	@echo "🧪 Testing AI service..."
	@curl -X POST http://localhost:5001/api/v1/chat \
		-H "Content-Type: application/json" \
		-d '{"message":"test","documentContent":"{}"}' | jq .

pgadmin: ## Запустить pgAdmin
	@docker-compose --profile tools up -d pgadmin
	@echo "✅ pgAdmin запущен на http://localhost:5050"
	@echo "Email: admin@journalist.local"
	@echo "Password: admin"

test-integration: ## Тест полной интеграции
	@./test_integration.sh

status: ## Показать статус всех сервисов
	@echo "📊 Docker containers:"
	@docker-compose ps
	@echo ""
	@echo "📊 Ports:"
	@lsof -i :5432 | head -2 || echo "PostgreSQL: ✗"
	@lsof -i :3000 | head -2 || echo "Backend: ✗"
	@lsof -i :5173 | head -2 || echo "Frontend: ✗"
	@lsof -i :5001 | head -2 || echo "AI Service: ✗"

