@echo off
REM ReWear Platform - Windows Deployment Script

setlocal enabledelayedexpansion

echo.
echo ========================================
echo ReWear Platform - Deployment Script
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed
    exit /b 1
)

echo [OK] Docker and Docker Compose found

REM Check if .env exists
if not exist .env (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env
    echo [WARNING] Please edit .env with your configuration
    exit /b 1
)

echo [OK] .env file found

REM Build and start
echo [INFO] Building Docker image...
docker-compose build

echo [INFO] Starting services...
docker-compose up -d

REM Wait for services
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak

REM Check health
echo [INFO] Checking health endpoints...

REM Check API health
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] API health check failed
    docker-compose logs rewear-app
    exit /b 1
)
echo [OK] API is healthy

REM Check database
curl -s http://localhost:5000/api/health/db >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Database health check failed
    docker-compose logs rewear-app
    exit /b 1
)
echo [OK] Database is healthy

REM Check AI services
curl -s http://localhost:5000/api/health/ai >nul 2>&1
if errorlevel 1 (
    echo [WARNING] AI services not fully configured
) else (
    echo [OK] AI services configured
)

echo.
echo ========================================
echo Deployment successful!
echo ========================================
echo.
echo Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   API Docs: http://localhost:5000/api/health
echo.
echo Useful commands:
echo   View logs:     docker-compose logs -f rewear-app
echo   Stop services: docker-compose down
echo   Restart:       docker-compose restart
echo   Status:        docker-compose ps
echo.
echo ReWear Platform is ready to use!
echo.

pause
