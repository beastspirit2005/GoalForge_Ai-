@echo off
title GoalForge AI - Docker Hub Deployer
cls
echo ===================================================
echo   GoalForge AI - Secure Docker Hub Image Pusher
echo ===================================================
echo.

:: Prompt securely for credentials
set /p DOCKER_USERNAME="Enter Docker Hub Username: "
set /p DOCKER_PASSWORD="Enter Docker Hub Password/Token: "

echo.
echo [1/3] Logging into Docker Hub...
:: Use password-stdin pipe to log in securely without printing password
echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker login failed! Please verify your username and password/token.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Tagging local container images for user '%DOCKER_USERNAME%'...
docker tag beastspirit2005/goalforge-backend:latest %DOCKER_USERNAME%/goalforge-backend:latest
docker tag beastspirit2005/goalforge-frontend:latest %DOCKER_USERNAME%/goalforge-frontend:latest

echo.
echo [3/3] Uploading images to Docker Hub...
echo.
echo Pushing: %DOCKER_USERNAME%/goalforge-backend:latest
docker push %DOCKER_USERNAME%/goalforge-backend:latest
echo.
echo Pushing: %DOCKER_USERNAME%/goalforge-frontend:latest
docker push %DOCKER_USERNAME%/goalforge-frontend:latest

echo.
echo ===================================================
echo   SUCCESS: All images pushed successfully!
echo ===================================================
echo.
pause
