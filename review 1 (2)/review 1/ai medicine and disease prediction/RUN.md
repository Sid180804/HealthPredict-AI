# How to Run the Project

## Prerequisites

1. **Python 3.8+** - Already installed ✓
2. **Node.js 16+** - Required for frontend

## Quick Start

### Option 1: Use the Startup Script (Recommended)

```powershell
.\start.ps1
```

This script will:
- Check and install backend dependencies
- Start the backend server
- Check for Node.js and start frontend if available

### Option 2: Manual Start

#### Backend Server

```powershell
cd backend
python app.py
```

Backend will run on: **http://127.0.0.1:5000**

#### Frontend Server (requires Node.js)

```powershell
cd frontend
npm install  # First time only
npm run dev
```

Frontend will run on: **http://localhost:5173**

## Installing Node.js (if not installed)

### Option 1: Download from website
1. Visit: https://nodejs.org/
2. Download and install the LTS version
3. Restart your terminal/IDE

### Option 2: Using winget (Windows Package Manager)
```powershell
winget install OpenJS.NodeJS
```

### Option 3: Using Chocolatey
```powershell
choco install nodejs
```

## Verify Installation

### Check Python
```powershell
python --version
```

### Check Node.js
```powershell
node --version
npm --version
```

## Access the Application

Once both servers are running:
- **Frontend**: Open http://localhost:5173 in your browser
- **Backend API**: http://127.0.0.1:5000

## Troubleshooting

### Backend not starting?
- Check if port 5000 is already in use
- Verify Flask is installed: `python -c "import flask"`
- Install dependencies: `cd backend && pip install -r requirements.txt`

### Frontend not starting?
- Verify Node.js is installed: `node --version`
- Install dependencies: `cd frontend && npm install`
- Check if port 5173 is available

### Port already in use?
- Backend: Change port in `backend/app.py` (line 361)
- Frontend: Vite will automatically use the next available port
