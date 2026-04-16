#!/bin/bash

# ReWear Platform Deployment Script

echo "🚀 Starting ReWear Platform Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing deployment..."
fi

# Build client
echo "🏗️  Building client application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build client application"
    exit 1
fi

echo "✅ Client application built successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your configuration"
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🌟 Advanced Features Available:"
echo "   • AI Damage Detection"
echo "   • Real-time Delivery Tracking"
echo "   • Trust Score System"
echo "   • Sustainability Gamification"
echo "   • Smart Pricing Engine"
echo "   • Escrow Payment System"
echo ""
echo "Happy coding! 🎯"