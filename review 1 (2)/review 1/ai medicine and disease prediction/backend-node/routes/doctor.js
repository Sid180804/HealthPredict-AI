const express          = require('express');
const router           = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES }        = require('../config/constants');
const doctorCtrl       = require('../controllers/doctorController');

// Every doctor route requires a valid JWT + doctor role
const guard = [authenticate, authorize(ROLES.DOCTOR)];

router.get('/profile',       ...guard, doctorCtrl.getProfile);
router.put('/profile',       ...guard, doctorCtrl.updateProfile);
router.put('/availability',  ...guard, doctorCtrl.updateAvailability);
router.put('/toggle-online', ...guard, doctorCtrl.toggleOnline);
router.get('/appointments',  ...guard, doctorCtrl.getAppointments);

module.exports = router;
