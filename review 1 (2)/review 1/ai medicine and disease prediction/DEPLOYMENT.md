# Deployment Guide

## AI Clinical Decision Support & Prescription Fulfillment Platform

### Prerequisites

- Python 3.8+
- Node.js 18+
- pip
- npm

### Backend Setup

1. **Create virtual environment (recommended)**

   ```bash
   cd backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Optional: Gemini AI Chatbot**

   Set environment variable for AI chatbot:
   ```
   export GEMINI_API_KEY=your_key_here
   ```
   Or create `.env` in backend:
   ```
   GEMINI_API_KEY=your_key_here
   ```

4. **Run backend**

   ```bash
   python app.py
   ```
   Backend runs on http://127.0.0.1:5000

### Frontend Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**

   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:5173

3. **Production build**

   ```bash
   npm run build
   npm run preview
   ```

### Environment Variables

| Variable | Description |
|----------|-------------|
| GEMINI_API_KEY | Optional. Enables AI chatbot with Gemini API. |
| FLASK_ENV | Set to `production` for production. |
| PORT | Backend port (default: 5000). |

### Quick Start

- **Backend**: `cd backend && python app.py`
- **Frontend**: `cd frontend && npm run dev`
- **Both**: Use `run.bat` (Windows) or `.\start.ps1`

### API Endpoints

- `GET /health` - Health check
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/predict` - Symptom-based disease risk prediction
- `POST /api/chat` - AI health chatbot
- `POST /api/prescription/extract` - Prescription OCR extraction
- `POST /api/orders` - Create order (prescription required)
- `GET /api/model/evaluation` - Model metrics
