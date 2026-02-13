const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/validator');

router.post('/login', authLimiter, sanitizeInput, authController.login);
router.get('/verify', verifyToken, authController.verify);

module.exports = router;
