require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./src/routes/authRoutes');
const scriptRoutes = require('./src/routes/scriptRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: ['roblox.com', '*.roblox.com'],
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scripts', scriptRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
