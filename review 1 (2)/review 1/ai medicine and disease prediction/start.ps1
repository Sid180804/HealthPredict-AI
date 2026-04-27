# Startup script for AI Medicine and Disease Prediction Project
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting AI Medicine & Disease Prediction" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Flask installation
Write-Host "[2/4] Checking backend dependencies..." -ForegroundColor Yellow
python -c "import flask" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Installing backend dependencies..." -ForegroundColor Yellow
    cd backend
    python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
    cd ..
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
}

# Check Node.js
Write-Host "[3/4] Checking Node.js..." -ForegroundColor Yellow
$nodeAvailable = $false
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0 -and $nodeVersion -notmatch "not recognized") {
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
        $nodeAvailable = $true
        
        # Check frontend dependencies
        if (Test-Path "frontend\node_modules") {
            Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
            cd frontend
            npm install
            cd ..
        }
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run the frontend, please install Node.js:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. Or use winget: winget install OpenJS.NodeJS" -ForegroundColor White
    Write-Host ""
    Write-Host "Starting backend only..." -ForegroundColor Yellow
}

# Start Backend
Write-Host "[4/4] Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd backend
    python app.py
}
Start-Sleep -Seconds 3

# Check if backend started
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend server running on http://127.0.0.1:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend may still be starting..." -ForegroundColor Yellow
}

# Start Frontend if Node.js is available
if ($nodeAvailable) {
    Write-Host ""
    Write-Host "Starting frontend server..." -ForegroundColor Yellow
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        cd frontend
        npm run dev
    }
    Start-Sleep -Seconds 5
    
    Write-Host "✓ Frontend server starting on http://localhost:5173" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Servers are running!" -ForegroundColor Green
    Write-Host "  Backend:  http://127.0.0.1:5000" -ForegroundColor White
    Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
    Write-Host ""
    
    # Wait for user interrupt
    try {
        Wait-Job $backendJob, $frontendJob
    } finally {
        Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Backend is running!" -ForegroundColor Green
    Write-Host "  Backend:  http://127.0.0.1:5000" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Install Node.js to run the frontend" -ForegroundColor Yellow
    Write-Host ""
    
    # Wait for user interrupt
    try {
        Wait-Job $backendJob
    } finally {
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
    }
}
