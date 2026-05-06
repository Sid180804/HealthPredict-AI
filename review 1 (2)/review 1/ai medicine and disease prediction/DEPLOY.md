# HealthPredict AI — Production Deployment Guide

## Architecture

```
Vercel (Frontend SPA)
  └──► Render (Node.js backend)
  └──► Render (Flask ML service)
```

---

## Recommended — Render Blueprint

Use the repository-root `render.yaml` file. It creates both Render services, pins Python to 3.11.14, installs `setuptools`/`wheel` before Python dependencies, and wires `ML_SERVICE_URL` from the ML service into the Node backend.

Manual setup is below if you do not use the Blueprint.

---

## Step 1 — Deploy Flask ML Service to Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `healthpredict-ml`
   - **Root Directory**: `ml_service`
   - **Runtime**: Python 3
   - **Build Command**: `python -m pip install --upgrade pip setuptools wheel && python -m pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
4. Environment Variables (click "Add Environment Variable"):
   ```
   PYTHON_VERSION = 3.11.14
   OPENAI_API_KEY = sk-proj-...
   JWT_SECRET     = <generated or shared secret>
   ```
5. Click **Create Web Service** — note the URL (e.g. `https://healthpredict-ml.onrender.com`)

---

## Step 2 — Deploy Node.js Backend to Render

1. Render → New → Web Service
2. Settings:
   - **Name**: `healthpredict-backend`
   - **Root Directory**: `review 1 (2)/review 1/ai medicine and disease prediction/backend-node`
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
3. Environment Variables:
   ```
   NODE_ENV        = production
   NODE_VERSION    = 20.19.5
   OPENAI_API_KEY  = sk-proj-...
   JWT_SECRET      = <generated or shared secret>
   ML_SERVICE_URL  = https://healthpredict-ml.onrender.com
   ALLOWED_ORIGINS = https://healthpredict-ai.vercel.app
   ```
4. Click **Create Web Service** — note the URL (e.g. `https://healthpredict-backend.onrender.com`)

---

## Step 4 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `review 1 (2)/review 1/ai medicine and disease prediction/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables (Project Settings → Environment Variables):
   ```
   VITE_API_BASE  = https://healthpredict-backend.onrender.com
   VITE_ML_URL    = https://healthpredict-ml.onrender.com
   VITE_AUTH_URL  = https://healthpredict-ml.onrender.com
   ```
5. Click **Deploy**
6. Your app lives at: `https://healthpredict-ai.vercel.app` (or your custom domain)

---

## Step 5 — Update CORS After Deploy

Once you have the Vercel URL, go to the Render **Node backend** service:
- Environment Variables → Edit `ALLOWED_ORIGINS`
- Set it to your exact Vercel URL: `https://healthpredict-ai.vercel.app`
- Render auto-redeploys on env var changes

---

## Environment Variables Summary

| Variable | Service | Example Value |
|----------|---------|---------------|
| `VITE_API_BASE` | Vercel | `https://healthpredict-backend.onrender.com` |
| `VITE_ML_URL` | Vercel | `https://healthpredict-ml.onrender.com` |
| `VITE_AUTH_URL` | Vercel | `https://healthpredict-ml.onrender.com` |
| `OPENAI_API_KEY` | Render (both) | `sk-proj-...` |
| `JWT_SECRET` | Render (both) | same 32-byte hex |
| `ML_SERVICE_URL` | Render (Node) | `https://healthpredict-ml.onrender.com` |
| `ALLOWED_ORIGINS` | Render (Node) | `https://healthpredict-ai.vercel.app` |
| `PYTHON_VERSION` | Render ML | `3.11.14` |
| `NODE_VERSION` | Render Node | `20.19.5` |

---

## Local Development

```bash
# Terminal 1 — ML service
cd ml_service
python app.py

# Terminal 2 — Node backend
cd backend-node
node server.js

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Create `frontend/.env.local`:
```
VITE_API_BASE=http://localhost:5000
VITE_ML_URL=http://localhost:5001
VITE_AUTH_URL=http://localhost:5002
```

---

## Redeployment

- **Frontend**: Push to main branch → Vercel auto-deploys
- **Backend**: Push to main branch → Render auto-deploys (or click "Manual Deploy")
- **Env var changes**: Take effect immediately, service restarts automatically
