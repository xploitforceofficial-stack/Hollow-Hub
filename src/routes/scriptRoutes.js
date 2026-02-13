const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');
const { verifyToken, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');
const { uploadLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput, validateScript } = require('../middleware/validator');

// Public routes
router.get('/', apiLimiter, scriptController.getScripts);
router.get('/search', apiLimiter, scriptController.searchScripts);
router.get('/trending', apiLimiter, scriptController.getTrending);
router.get('/:id', apiLimiter, scriptController.getScriptDetail);

// Protected routes
router.post('/', verifyToken, uploadLimiter, sanitizeInput, validateScript, scriptController.uploadScript);
router.post('/:id/like', verifyToken, apiLimiter, scriptController.likeScript);
router.put('/:id', verifyToken, isOwnerOrAdmin, sanitizeInput, validateScript, scriptController.editScript);
router.delete('/:id', verifyToken, isOwnerOrAdmin, scriptController.deleteScript);

module.exports = router;
