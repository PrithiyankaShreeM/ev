@echo off
echo ==============================================
echo ⚡ Starting WattStop EV Home Charging Platform
echo ==============================================

start "WattStop Backend Server" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul
start "WattStop Frontend Client" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo WattStop is starting up!
echo - Backend API:  http://localhost:5000/api
echo - Frontend Web: http://localhost:5173
echo.
pause
