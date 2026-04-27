const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Mock ID generator
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Create Order from Prescription
router.post('/', (req, res) => {
    try {
        const { userId, prescriptionId, medicines, address, platform } = req.body;

        if (!userId || !medicines || medicines.length === 0) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        const newOrder = {
            id: generateId(),
            userId,
            prescriptionId, // Optional if direct order? No, system requires prescription.
            medicines,
            address,
            platform: platform || 'Pharmacy Partner',
            status: 'placed', // placed, processing, shipped, delivered
            totalAmount: Math.floor(Math.random() * 500) + 100, // Mock price
            createdAt: new Date(),
            timeline: [
                { status: 'placed', time: new Date(), description: 'Order placed successfully' }
            ]
        };

        db.orders.get('orders').push(newOrder).write();

        res.status(201).json({
            message: 'Order placed successfully',
            order: newOrder
        });

    } catch (err) {
        console.error('Order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get User Orders
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const orders = db.orders.get('orders').filter({ userId }).value();
    res.json({ orders });
});

// Get Order Status
router.get('/:orderId', (req, res) => {
    const { orderId } = req.params;
    const order = db.orders.get('orders').find({ id: orderId }).value();

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
});

module.exports = router;
