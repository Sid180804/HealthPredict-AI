const express = require('express');
const router = express.Router();
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

const proxyRequest = async (method, url, data, res, params = {}) => {
    try {
        const response = await axios({ method, url: `${ML_SERVICE_URL}${url}`, data, params });
        res.json(response.data);
    } catch (error) {
        console.error(`Doctor Service Error (${url}):`, error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Doctor Service Unavailable' });
        }
    }
};

// Get all doctors (with optional filters via query params)
router.get('/', async (req, res) => {
    await proxyRequest('get', '/doctors', null, res, req.query);
});

// Get specific doctor by ID
router.get('/:id', async (req, res) => {
    await proxyRequest('get', `/doctors/${req.params.id}`, null, res);
});

// Get available slots for a doctor
router.get('/:id/slots', async (req, res) => {
    await proxyRequest('get', '/doctors/slots', null, res, { doctor_id: req.params.id, ...req.query });
});

// Book appointment for a doctor
// ml_service exposes /book-appointment; we adapt the REST-style URL here
router.post('/:id/book', async (req, res) => {
    const data = { ...req.body, doctor_id: parseInt(req.params.id) };
    await proxyRequest('post', '/book-appointment', data, res);
});

module.exports = router;
