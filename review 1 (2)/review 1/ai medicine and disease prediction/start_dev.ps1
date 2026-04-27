# Stop existing processes
Get-Process node, python -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Starting HealthPredict AI Platform..." -ForegroundColor Green

# Start Python ML Service (Port 5001)
$mlJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD/ml_service"
    python app.py
}
Write-Host "Started ML Service on Port 5001"

# Start Node.js Backend (Port 5000)
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD/backend-node"
    npm start
}
Write-Host "Started Node.js Backend on Port 5000"

# Start Frontend (Port 5173)
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD/frontend"
    npm run dev
}
Write-Host "Started Frontend on Port 5173"

Write-Host "`nAll services starting..."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:5000"
Write-Host "ML Service: http://localhost:5001"
Write-Host "`nPress Ctrl+C to stop all services."

# Keep script running to maintain jobs (or users can close window)
try {
    while ($true) {
        Receive-Job -Job $mlJob -ErrorAction SilentlyContinue
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}
finally {
    Stop-Job $mlJob, $backendJob, $frontendJob
}
