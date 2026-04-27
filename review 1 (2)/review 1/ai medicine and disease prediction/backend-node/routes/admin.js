const express          = require('express');
const router           = express.Router();
const axios            = require('axios');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES }        = require('../config/constants');
const adminCtrl        = require('../controllers/adminController');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// Every auth-guarded admin route requires a valid JWT + admin role
const guard = [authenticate, authorize(ROLES.ADMIN)];

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
