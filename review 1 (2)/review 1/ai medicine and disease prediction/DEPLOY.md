# HealthPredict AI — Production Deployment Guide

## Architecture

```
Vercel (Frontend SPA)
  └──► Render (Node.js backend) ──► MongoDB Atlas
  └──► Render (Flask ML service)
```

---

## Step 1 — MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create Free Cluster (M0)
2. Create a database user: Database Access → Add User
3. Whitelist all IPs: Network Access → `0.0.0.0/0`
4. Click **Connect** → Drivers → copy the connection string
5. Replace `<password>` with your database user's password
6. **Save the connection string** — you'll need it for both Render services

---

## Step 2 — Deploy Flask ML Service to Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `healthpredict-ml`
   - **Root Directory**: `review 1 (2)/review 1/ai medicine and disease prediction/ml_service`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
4. Environment Variables (click "Add Environment Variable"):
   ```
   OPENAI_API_KEY = sk-proj-...
   DB_URI         = mongodb+srv://...
   JWT_SECRET     = <same 32-byte hex for all services>
   ```
5. Click **Create Web Service** — note the URL (e.g. `https://healthpredict-ml.onrender.com`)

---

## Step 3 — Deploy Node.js Backend to Render

1. Render → New → Web Service
2. Settings:
   - **Name**: `healthpredict-backend`
   - **Root Directory**: `review 1 (2)/review 1/ai medicine and disease prediction/backend-node`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. Environment Variables:
   ```
   NODE_ENV        = production
   OPENAI_API_KEY  = sk-proj-...
   DB_URI          = mongodb+srv://...
   JWT_SECRET      = <same secret as ML service>
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
| `DB_URI` | Render (both) | `mongodb+srv://...` |
| `JWT_SECRET` | Render (both) | same 32-byte hex |
| `ML_SERVICE_URL` | Render (Node) | `https://healthpredict-ml.onrender.com` |
| `ALLOWED_ORIGINS` | Render (Node) | `https://healthpredict-ai.vercel.app` |

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
