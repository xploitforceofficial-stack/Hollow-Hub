// ============================================
// ROBLOX SCRIPT HUB - PRODUCTION SERVER
// Optimized for Railway Deployment
// ============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const scriptRoutes = require('./src/routes/scriptRoutes');

// Import Middleware
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// ============================================
// EXPRESS APP INITIALIZATION
// ============================================
const app = express();

// Trust proxy - Required for rate limiter behind Railway proxy
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet with custom configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://*.roblox.com"],
            connectSrc: ["'self'", "https://*.roblox.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for Roblox
app.use(cors({
    origin: [
        'https://roblox.com',
        'https://www.roblox.com',
        /\.roblox\.com$/,
        /\.railway\.app$/,
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Compression for better performance
app.use(compression({
    level: 6, // Balanced compression
    threshold: 100 * 1024, // 100KB threshold
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// Body parser with size limit
app.use(express.json({ 
    limit: '1mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '1mb' 
}));

// MongoDB injection sanitization
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`🚨 Potential MongoDB injection attempt blocked: ${key}`);
    }
}));

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ============================================
// DATABASE CONNECTION
// ============================================
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Maximum number of connections in the pool
            minPoolSize: 2,  // Minimum number of connections in the pool
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true,
            retryReads: true
        });
        
        console.log('✅ MongoDB Atlas Connected');
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Pool Size: ${mongoose.connection.client.options.maxPoolSize}`);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        console.error('   - Check MongoDB Atlas IP Whitelist');
        console.error('   - Verify connection string');
        console.error('   - Ensure network access is enabled');
        process.exit(1);
    }
};

connectDB();

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected, attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

// ============================================
// API ROUTES
// ============================================

// Health check endpoint (required for Railway)
app.get('/health', (req, res) => {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: process.memoryUsage(),
        version: process.version,
        apiVersion: '1.0.0'
    };
    
    res.status(200).json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Roblox Script Hub API',
        version: '1.0.0',
        description: 'Professional Script Hub with Cloud Storage',
        endpoints: {
            health: '/health',
            auth: '/api/auth/login',
            scripts: '/api/scripts',
            search: '/api/scripts/search',
            trending: '/api/scripts/trending'
        },
        documentation: 'https://github.com/yourusername/roblox-script-hub',
        status: 'operational'
    });
});

// API Routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/scripts', apiLimiter, scriptRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
app.use(errorHandler);

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('   Reason:', reason);
    // Don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Graceful shutdown
    if (process.env.NODE_ENV === 'production') {
        console.log('   Gracefully shutting down...');
        mongoose.connection.close().then(() => {
            console.log('   MongoDB connection closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...');
    mongoose.connection.close().then(() => {
        console.log('   MongoDB connection closed');
        process.exit(0);
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('🚀  ROBLOX SCRIPT HUB');
    console.log('=================================');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Server: http://0.0.0.0:${PORT}`);
    console.log(`📍 Health: http://0.0.0.0:${PORT}/health`);
    console.log(`📍 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`📍 Node Version: ${process.version}`);
    console.log(`📍 Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
    console.log('=================================\n');
});

// Increase timeout for large uploads
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds

module.exports = app;
