#!/bin/bash

# Integration Test Script

echo "🧪 Testing Full Stack Integration"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test PostgreSQL
echo -n "1. PostgreSQL... "
if docker ps | grep -q ai-journalist-db; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Run: make up"
    exit 1
fi

# Test Backend
echo -n "2. Backend API... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Run: make backend"
    exit 1
fi

# Test AI Service
echo -n "3. AI Service... "
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    AI_AVAILABLE=true
else
    echo -e "${RED}✗ (optional)${NC}"
    echo "   Run: make ai-service"
    AI_AVAILABLE=false
fi

# Test Frontend
echo -n "4. Frontend... "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Run: make frontend"
    exit 1
fi

echo ""
echo "📊 API Tests"
echo "============"

# Test Create Session
echo -n "Creating test session... "
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test",
    "resourceId": "integration-test",
    "title": "Integration Test Article"
  }')

DOC_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$DOC_ID" ]; then
    echo -e "${GREEN}✓${NC} (ID: $DOC_ID)"
else
    echo -e "${RED}✗${NC}"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi

# Test Get Document
echo -n "Fetching document... "
DOC=$(curl -s http://localhost:3000/documents/$DOC_ID)
if echo $DOC | grep -q "id"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Test AI Chat (mock mode if AI service not available)
echo -n "Testing AI chat... "
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/ai/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"documentId\": \"$DOC_ID\",
    \"message\": \"Test message\"
  }")

if echo $CHAT_RESPONSE | grep -q "message"; then
    echo -e "${GREEN}✓${NC}"
    if [ "$AI_AVAILABLE" = true ]; then
        echo "   Mode: Real AI"
    else
        echo "   Mode: Mock (AI service not running)"
    fi
else
    echo -e "${RED}✗${NC}"
    echo "Response: $CHAT_RESPONSE"
fi

echo ""
echo "✅ Integration test complete!"
echo ""
echo "🌐 Services:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   AI:       http://localhost:5001"
echo ""
echo "📝 Test Document ID: $DOC_ID"
echo "   Open: http://localhost:5173"

