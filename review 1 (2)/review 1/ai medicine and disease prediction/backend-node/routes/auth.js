const express        = require('express');
const router         = express.Router();
const { authenticate } = require('../middleware/auth');
const authCtrl       = require('../controllers/authController');

router.post('/register', authCtrl.register);
router.post('/login',    authCtrl.login);
router.get('/me',        authenticate, authCtrl.getMe);
router.post('/logout',   authenticate, authCtrl.logout);
router.put('/profile',   authenticate, authCtrl.updateProfile);

module.exports = router;
