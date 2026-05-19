@echo off
title GoalForge AI - Docker Hub Deployer
cls
echo ===================================================
echo   GoalForge AI - Secure Docker Hub Image Pusher
echo ===================================================
echo.

set /p DOCKER_USERNAME="Enter Docker Hub Username: "
set /p DOCKER_PASSWORD="Enter Docker Hub Password/Token: "

echo.
echo [1/4] Logging into Docker Hub...
echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker login failed! Please verify your username and password/token.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Building images (frontend proxies /api to backend:8000)...
docker build -t %DOCKER_USERNAME%/goalforge-backend:latest ./backend
docker build -t %DOCKER_USERNAME%/goalforge-frontend:latest --build-arg API_PROXY_TARGET=http://backend:8000 ./frontend

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Pushing backend...
docker push %DOCKER_USERNAME%/goalforge-backend:latest

echo.
echo [4/4] Pushing frontend...
docker push %DOCKER_USERNAME%/goalforge-frontend:latest

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker push failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   SUCCESS: All images pushed successfully!
echo ===================================================
echo.
pause
