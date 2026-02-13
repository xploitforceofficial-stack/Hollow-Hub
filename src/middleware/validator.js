const xss = require('xss');
const { body, validationResult } = require('express-validator');

const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key].trim());
            }
        });
    }
    next();
};

const validateScript = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3-100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description max 500 characters'),
    body('code')
        .trim()
        .isLength({ min: 10, max: process.env.MAX_SCRIPT_SIZE || 50000 })
        .withMessage(`Code must be between 10-${process.env.MAX_SCRIPT_SIZE || 50000} characters`),
    body('gameName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Game name must be between 2-50 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = { sanitizeInput, validateScript };
