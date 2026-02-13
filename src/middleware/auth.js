const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).lean();
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

const isOwnerOrAdmin = async (req, res, next) => {
    try {
        const Script = require('../models/Script');
        const script = await Script.findById(req.params.id);
        
        if (!script) {
            return res.status(404).json({
                success: false,
                message: 'Script not found'
            });
        }

        if (req.user.role === 'admin' || script.uploader.toString() === req.user._id.toString()) {
            req.script = script;
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { verifyToken, isAdmin, isOwnerOrAdmin };
