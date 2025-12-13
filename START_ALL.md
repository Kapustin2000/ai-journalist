# Start All Services

## Option 1: Manual (Recommended for Development)

```bash
# Terminal 1: PostgreSQL
make up

# Terminal 2: Backend
make backend

# Terminal 3: Frontend  
make frontend

# Terminal 4: AI Service (optional)
make ai-service
```

## Option 2: Background

```bash
# Start PostgreSQL
make up

# Start backend in background
cd back-end && pnpm run start:dev > ../logs/backend.log 2>&1 &

# Start frontend in background
cd asrp-editor && pnpm run dev > ../logs/frontend.log 2>&1 &

# Start AI service in background
./run_ai_service.sh > logs/ai-service.log 2>&1 &
```

## Check Status

```bash
make status
```

## Test Integration

```bash
make test-integration
```

## Access Services

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **AI Service**: http://localhost:5001
- **Prisma Studio**: `make prisma-studio`

## Stop All

```bash
# Stop Docker
make down

# Stop Node processes
pkill -f "nest start"
pkill -f "vite"

# Stop Python
pkill -f "api_server.py"
```

## Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Database Connection Error

```bash
make down
make up
cd back-end && pnpm prisma migrate dev
```

### Frontend Can't Connect to Backend

Check `.env` files:
- `asrp-editor/.env` → `VITE_API_URL=http://localhost:3000`
- `back-end/.env` → `PORT=3000`

### AI Service Not Working

1. Check `.env.ai` has valid `GOOGLE_API_KEY`
2. Backend will use mock responses if AI service is down
3. Check logs: `tail -f logs/ai-service.log`

