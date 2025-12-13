#!/bin/bash

# AI Journalist Service Launcher

set -e

echo "🤖 Starting AI Journalist Service..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing dependencies..."
echo "   This may take a few minutes, especially for google-adk..."
pip install --progress-bar off -r requirements.txt

# Load environment variables from ai_journalist/.env
if [ -f "ai_journalist/.env" ]; then
    echo "📝 Loading environment variables from ai_journalist/.env..."
    export $(cat ai_journalist/.env | grep -v '^#' | xargs)
elif [ -f ".env.ai" ]; then
    echo "📝 Loading environment variables from .env.ai..."
    export $(cat .env.ai | grep -v '^#' | xargs)
fi

# Check for Google API key
if [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" = "your_google_api_key_here" ]; then
    echo "⚠️  Warning: GOOGLE_API_KEY not set"
    echo "   AI service will run but may not work properly"
else
    echo "✅ GOOGLE_API_KEY found"
fi

# Set PYTHONPATH to include project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Check if port is already in use
AI_PORT=${AI_SERVICE_PORT:-5001}
if lsof -Pi :$AI_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port $AI_PORT is already in use. Killing existing process..."
    lsof -ti :$AI_PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Run the service
echo "🚀 Starting AI service on port $AI_PORT..."
echo "📋 Logs will be displayed below. Press Ctrl+C to stop."
echo ""

# Run with unbuffered output for real-time logs
PYTHONUNBUFFERED=1 python ai_journalist/api_server.py

