@echo off
echo ========================================
echo AI Medicine and Disease Prediction
echo ========================================
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && python app.py"
timeout /t 3 /nobreak >nul
echo.
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js found! Starting Frontend...
    start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"
    echo.
    echo ========================================
    echo Both servers are starting!
    echo   Backend:  http://127.0.0.1:5000
    echo   Frontend: http://localhost:5173
    echo ========================================
) else (
    echo.
    echo Node.js not found!
    echo Backend is running on http://127.0.0.1:5000
    echo.
    echo To run the frontend, install Node.js from:
    echo   https://nodejs.org/
    echo.
    echo Then run: run-frontend.bat
)
echo.
echo Press any key to exit...
pause >nul
