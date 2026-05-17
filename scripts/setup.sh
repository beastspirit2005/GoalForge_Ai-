#!/bin/bash
# GoalForge AI - Quick Setup Script

echo "🚀 GoalForge AI - Setup"
echo "========================"

# Check for Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend
python -m venv venv
source venv/bin/activate || source venv/Scripts/activate
pip install -r requirements.txt
cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

# Environment
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  No .env file found. Copy .env.example to .env and configure it."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start PostgreSQL and create the 'goalforge' database"
echo "  2. cd backend && uvicorn app.main:app --reload"
echo "  3. cd frontend && npm run dev"
echo "  4. python scripts/seed.py  (to add demo data)"
echo ""
echo "Or use Docker: docker-compose up"
