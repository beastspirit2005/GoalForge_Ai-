#!/bin/bash
# GoalForge AI - Deploy Script

echo "🚀 GoalForge AI - Deploy"
echo "========================"

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Build and start with Docker
echo "🐳 Starting with Docker Compose..."
docker-compose up -d --build

echo ""
echo "✅ Deployment complete!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
