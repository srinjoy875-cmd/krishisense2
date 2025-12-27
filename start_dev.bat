@echo off
echo Starting KrishiSense IoT Dashboard...

:: Start Backend
start "KrishiSense Backend" cmd /k "cd backend && npm install && npm run dev"

:: Start Frontend
start "KrishiSense Frontend" cmd /k "cd frontend && npm install && npm run dev"

:: Start ML Engine (Microservice)
start "KrishiSense ML Engine" cmd /k "cd backend/ml_engine && set PORT=5001 && python app.py"

echo Servers are starting...
echo Backend:  http://localhost:5000
echo Frontend: http://127.0.0.1:3005
echo ML Engine: http://localhost:5001
pause
