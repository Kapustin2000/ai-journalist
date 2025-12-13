# AI Service Setup

## Quick Start

```bash
# 1. Set Google API key
nano .env.ai
# Add your GOOGLE_API_KEY

# 2. Run service
./run_ai_service.sh

# Or use Make
make ai-service
```

## Endpoints

### POST /api/v1/rewrite-block
```json
{
  "blockId": "block_abc",
  "content": "Original text",
  "instruction": "Make it shorter",
  "context": "Surrounding text..."
}
```

### POST /api/v1/insert-block
```json
{
  "insertAfter": "block_abc",
  "instruction": "Add introduction",
  "context": "..."
}
```

### POST /api/v1/chat
```json
{
  "documentContent": "{}",
  "message": "Improve the article",
  "selectedBlockId": "block_abc"
}
```

### POST /api/v1/improve-article
```json
{
  "documentId": "doc-123",
  "content": {}
}
```

## Testing

```bash
# Test service health
curl http://localhost:5001/health

# Test chat
make test-ai-direct

# Test through backend
make test-ai
```

## Configuration

Edit `.env.ai`:
- `AI_SERVICE_PORT` - service port (default: 5001)
- `GOOGLE_API_KEY` - your Google ADK API key
- `AI_MODEL` - model to use (default: gemini-2.5-flash)

## Architecture

```
Backend (NestJS)
    ↓
AI Service (Flask) - Port 5001
    ↓
Google ADK
    ↓
Gemini API
```

## Development

```bash
# Activate venv
source venv/bin/activate

# Install deps
pip install -r requirements.txt

# Run
python ai_journalist/api_server.py
```

