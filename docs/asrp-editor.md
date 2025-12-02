# `@asrp/editor`

Универсальный редактор контента для проектов ASRP (школа, медиа, научный журнал).

Поставляется как независимый npm-пакет и работает с единым Editor Backend (`editor-api.asrp.tech`).

Интеграция занимает 5–10 минут.

## Возможности

* Редактор статей, уроков, ресурсов и любых текстовых блоков.
* Многоуровневая структура документов (title, blocks, metadata).
* Автосохранение, версии.
* AI-функции (титулы, переписывание, рефакторинг блоков).
* Webhooks для публикации и синхронизации с вашими проектами.
* Multi-tenant: каждый проект работает в своём пространстве (`projectId`).

---

## Установка

```bash
npm install @asrp/editor
# или
yarn add @asrp/editor
```

---

## Быстрый старт

Минимальная интеграция в React:

```tsx
import { AsrpEditor } from "@asrp/editor";

export default function ArticleEditor({ resourceId, token }) {
  return (
    <AsrpEditor
      projectId="media"
      resourceId={resourceId}
      token={token}
    />
  );
}
```

### Обязательные параметры

| Prop         | Тип    | Описание                                            |
| ------------ | ------ | --------------------------------------------------- |
| `projectId`  | string | Идентификатор проекта: `media`, `school`, `journal` |
| `resourceId` | string | ID ресурса (статьи, урока) в вашем проекте          |
| `token`      | string | JWT вашего проекта, выданный Editor Backend         |

---

## Где хранятся данные

Источник истины — **Editor Backend**.

Каждый документ уникален по связке:

```
projectId + resourceId
```

Проект может хранить у себя только `editorDocumentId` или полный “снимок” после публикации.

---

## Маршруты Editor Backend

### Получить документ

```
GET /documents?projectId=media&resourceId=123
```

### Сохранить документ

```
POST /documents/save
```

Payload:

```json
{
  "projectId": "media",
  "resourceId": "123",
  "blocks": [...],
  "metadata": {
    "title": "Example title"
  }
}
```

### Выполнить AI-операцию

```
POST /ai/rewrite-block
```

Payload:

```json
{
  "projectId": "media",
  "resourceId": "123",
  "blockId": "abc",
  "instruction": "Make text more concise"
}
```

---

## Webhooks

Ваш проект должен иметь один эндпоинт, например:

```
POST https://yourproject.com/editor/webhook
```

### События

#### `document.published`

```json
{
  "event": "document.published",
  "projectId": "media",
  "resourceId": "123",
  "editorDocumentId": "abc123",
  "title": "New title",
  "slug": "new-title",
  "blocks": [...]
}
```

#### `document.updated`

```json
{
  "event": "document.updated",
  "projectId": "media",
  "resourceId": "123"
}
```

---

## Авторизация

Ваш backend получает токен:

```
POST /auth/token
```

Payload:

```json
{
  "projectId": "media",
  "userId": "u42"
}
```

Возвращает:

```json
{
  "token": "jwt..."
}
```

Этот JWT вы передаёте в компонент `AsrpEditor`.

---

## Архитектура

```
Проект (media/school/journal)
   |
   | — компонент @asrp/editor
   |
Editor Backend (единый)
   | — хранение документов
   | — AI
   | — версии
   | — webhook → проекты
```

---

## Статусы документов

* `draft`
* `published`
* `archived`

---

## События редактора (опциональные callbacks)

```tsx
<AsrpEditor
  projectId="media"
  resourceId="123"
  token={token}
  onPublish={(doc) => console.log("Published", doc)}
  onStatusChange={(s) => console.log("Status:", s)}
  onError={(e) => console.error(e)}
/>
```

---

## Что нужно проекту для интеграции

Только:

1. Добавить компонент `AsrpEditor`.
2. Настроить один webhook.
3. Сделать метод получения JWT.

### Всё. Backend-CRUD для контента писать не нужно.

---

## Версионирование

Пакет следует SemVer:

* `1.x` — стабильный API
* `0.x` — экспериментальные функции

---

## Лицензия

ASRP © 2025.

---

Если нужно — подготовлю:

* OpenAPI-спеку
* TS-интерфейсы всех payload
* версию README для GitHub Marketplace
* вариант для iframe-встраивания


