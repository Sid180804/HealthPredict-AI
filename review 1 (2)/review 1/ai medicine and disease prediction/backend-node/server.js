require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "https://health-predict-ai-two.vercel.app", 
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
const authRoutes   = require('./routes/auth');
const aiRoutes     = require('./routes/ai');
const orderRoutes  = require('./routes/orders');
const doctorRoutes = require('./routes/doctors');   // ML-service proxy (patient-facing)
const doctorPanel  = require('./routes/doctor');    // Doctor dashboard routes
const adminRoutes  = require('./routes/admin');

app.get('/', (_req, res) => res.json({
  message:     'HealthAssist Clinic — API v2',
  status:      'running',
  endpoints:   ['/api/auth', '/api/ai', '/api/orders', '/api/doctors', '/api/doctor', '/api/admin', '/api/chat'],
}));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth',    authRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/doctors', doctorRoutes);   // GET /api/doctors  — patient doctor search
app.use('/api/doctor',  doctorPanel);    // GET /api/doctor/* — doctor's own panel
app.use('/api/admin',   adminRoutes);    // GET /api/admin/*  — admin panel

// /api/chat top-level alias (HealthAssistant component uses this directly)
app.use('/api/chat', (req, res, next) => {
  req.url = '/chat';
  aiRoutes(req, res, next);
});

// ── Catch-all ML proxy (forwards unmatched /api/* to Flask ML service) ──────
// Placed AFTER all real routes — only fires for paths not handled above
app.all('/api/*', async (req, res) => {
    // Strip /api prefix but keep path + query string for the ML service
    const mlPath = req.originalUrl.replace(/^\/api/, '');
    console.log(`[ML proxy] ${req.method} ${mlPath}`);
    try {
        const mlResponse = await axios({
            method: req.method,
            url: `${ML_SERVICE_URL}${mlPath}`,
            data: req.body,
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        res.json(mlResponse.data);
    } catch (err) {
        console.error(`ML proxy error (${mlPath}):`, err.message);
        if (err.response) res.status(err.response.status).json(err.response.data);
        else res.status(503).json({ error: 'ML service unavailable', message: err.message });
    }
});

// ── Error handler ───────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀  HealthAssist API running on http://localhost:${PORT}`);
  console.log(`    Roles: patient | doctor | admin`);
  console.log(`    Env:   ${process.env.NODE_ENV || 'development'}\n`);
});
