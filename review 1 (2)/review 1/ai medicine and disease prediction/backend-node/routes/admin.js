const express          = require('express');
const router           = express.Router();
const axios            = require('axios');
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const db               = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES, JWT_SECRET, JWT_EXPIRY } = require('../config/constants');
const adminCtrl        = require('../controllers/adminController');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';
const ALLOWED_ADMINS = new Set([
    'tomarsiddhanttomar@gmail.com',
    'shivanshthakra0311@gmail.com',
]);
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const genToken = (user) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
const safe = (user) => {
    const { password, ...rest } = user;
    return rest;
};

// Every auth-guarded admin route requires a valid JWT + admin role
const guard = [authenticate, authorize(ROLES.ADMIN)];

// ── Admin auth routes used by the Vercel frontend ──────────────────────────
router.post('/set-password', async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!ALLOWED_ADMINS.has(email)) {
            return res.status(403).json({ message: 'Unauthorized admin email' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const existing = db.users.get('users').find({ email }).value();
        if (existing) {
            db.users.get('users').find({ email }).assign({
                password: hashed,
                role: ROLES.ADMIN,
                name: existing.name || 'Admin',
            }).write();
        } else {
            db.users.get('users').push({
                id: genId(),
                name: 'Admin',
                email,
                password: hashed,
                role: ROLES.ADMIN,
                createdAt: new Date().toISOString(),
            }).write();
        }

        res.json({ message: 'Password created successfully' });
    } catch (err) {
        console.error('Admin set-password error:', err);
        res.status(500).json({ message: 'Failed to create admin password' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!ALLOWED_ADMINS.has(email)) {
            return res.status(403).json({ message: 'Unauthorized admin email' });
        }

        const user = db.users.get('users').find({ email }).value();
        if (!user || user.role !== ROLES.ADMIN || !user.password) {
            return res.status(401).json({ message: 'Please create password first' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        res.json({
            success: true,
            message: 'Admin login successful',
            role: ROLES.ADMIN,
            token: genToken(user),
            admin: safe(user),
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ message: 'Admin login failed' });
    }
});

// ── Auth-guarded Node/lowdb routes ──────────────────────────────────────────
router.get('/stats',                 ...guard, adminCtrl.getStats);
router.get('/doctors',               ...guard, adminCtrl.getDoctors);
router.put('/doctors/:id/verify',    ...guard, adminCtrl.verifyDoctor);
router.put('/doctors/:id/reject',    ...guard, adminCtrl.rejectDoctor);
router.get('/users',                 ...guard, adminCtrl.getUsers);
router.get('/appointments',          ...guard, adminCtrl.getAppointments);

// ── ML-service proxy helper ─────────────────────────────────────────────────
const proxyML = async (method, mlPath, req, res) => {
    try {
        const response = await axios({
            method,
            url: `${ML_SERVICE_URL}${mlPath}`,
            data: req.body,
            params: req.query,
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        res.json(response.data);
    } catch (err) {
        console.error(`Admin ML proxy error (${mlPath}):`, err.message);
        if (err.response) {
            res.status(err.response.status).json(err.response.data);
        } else {
            res.status(500).json({ error: 'ML service unavailable', detail: err.message });
        }
    }
};

// ── ML-service admin proxy routes ───────────────────────────────────────────
router.get('/ai-analytics',                  (req, res) => proxyML('get',    '/admin/ai-analytics',                  req, res));
router.get('/emergency',                     (req, res) => proxyML('get',    '/admin/emergency',                     req, res));

router.get('/medicines',                     (req, res) => proxyML('get',    '/admin/medicines',                     req, res));
router.post('/medicines',                    (req, res) => proxyML('post',   '/admin/medicines',                     req, res));
router.put('/medicines/:id',                 (req, res) => proxyML('put',    `/admin/medicines/${req.params.id}`,    req, res));
router.delete('/medicines/:id',              (req, res) => proxyML('delete', `/admin/medicines/${req.params.id}`,   req, res));

router.get('/feedback',                      (req, res) => proxyML('get',    '/admin/feedback',                      req, res));
router.post('/feedback',                     (req, res) => proxyML('post',   '/admin/feedback',                      req, res));

router.get('/security-logs',                 (req, res) => proxyML('get',    '/admin/security-logs',                 req, res));
router.post('/security-logs',                (req, res) => proxyML('post',   '/admin/security-logs',                 req, res));

router.get('/settings',                      (req, res) => proxyML('get',    '/admin/settings',                      req, res));
router.post('/settings',                     (req, res) => proxyML('post',   '/admin/settings',                      req, res));

router.get('/specializations',               (req, res) => proxyML('get',    '/admin/specializations',               req, res));
router.post('/specializations',              (req, res) => proxyML('post',   '/admin/specializations',               req, res));
router.put('/specializations/:id',           (req, res) => proxyML('put',    `/admin/specializations/${req.params.id}`, req, res));
router.delete('/specializations/:id',        (req, res) => proxyML('delete', `/admin/specializations/${req.params.id}`, req, res));

router.get('/business/revenue',              (req, res) => proxyML('get',    '/admin/business/revenue',              req, res));
router.get('/business/user-growth',          (req, res) => proxyML('get',    '/admin/business/user-growth',          req, res));
router.get('/business/doctor-growth',        (req, res) => proxyML('get',    '/admin/business/doctor-growth',        req, res));
router.get('/business/appointment-stats',    (req, res) => proxyML('get',    '/admin/business/appointment-stats',    req, res));

module.exports = router;
