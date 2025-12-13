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
pip install -q -r requirements.txt

# Load environment variables
if [ -f ".env.ai" ]; then
    export $(cat .env.ai | grep -v '^#' | xargs)
fi

# Check for Google API key
if [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" = "your_google_api_key_here" ]; then
    echo "⚠️  Warning: GOOGLE_API_KEY not set in .env.ai"
    echo "   AI service will run but may not work properly"
fi

# Run the service
echo "🚀 Starting AI service on port ${AI_SERVICE_PORT:-5001}..."
python ai_journalist/api_server.py

