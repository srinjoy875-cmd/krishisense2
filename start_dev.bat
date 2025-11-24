@echo off
echo Starting KrishiSense IoT Dashboard...

:: Start Backend
start "KrishiSense Backend" cmd /k "cd backend && npm install && npm run dev"

:: Start Frontend
start "KrishiSense Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo Servers are starting...
echo Backend will be at http://localhost:5000
echo Frontend will be at http://127.0.0.1:3005
pause
