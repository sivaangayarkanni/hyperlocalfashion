#!/bin/bash

# ReWear Platform - Deployment Script
# This script automates the deployment process

set -e

echo "🚀 ReWear Platform - Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Build and start
echo -e "${YELLOW}Building Docker image...${NC}"
docker-compose build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check health
echo -e "${YELLOW}Checking health endpoints...${NC}"

# Check API health
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
    docker-compose logs rewear-app
    exit 1
fi

# Check database
if curl -s http://localhost:5000/api/health/db > /dev/null; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${RED}❌ Database health check failed${NC}"
    docker-compose logs rewear-app
    exit 1
fi

# Check AI services
if curl -s http://localhost:5000/api/health/ai > /dev/null; then
    echo -e "${GREEN}✅ AI services configured${NC}"
else
    echo -e "${YELLOW}⚠️  AI services not fully configured${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "📊 Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  API Docs: http://localhost:5000/api/health"
echo ""
echo "📋 Useful commands:"
echo "  View logs:     docker-compose logs -f rewear-app"
echo "  Stop services: docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Status:        docker-compose ps"
echo ""
echo "🎉 ReWear Platform is ready to use!"
