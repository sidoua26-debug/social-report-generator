const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { router: authRouter } = require('./routes/auth');
const agencyRouter = require('./routes/agency');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists (configurable for persistent volume on Railway)
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS Configuration - Supports dynamic production domains (e.g., Vercel) or comma-separated list
const allowedOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl, health checks) or when wildcard is set
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview branch deployments if configured
    if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded logos and files statically
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/agency', agencyRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY')
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Social Report Generator API running on port ${PORT}`);
  console.log(`📂 Uploads directory: ${uploadsDir}`);
  console.log(`🌐 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    console.log('✨ Gemini AI integration enabled');
  } else {
    console.log('ℹ️ Running in Smart Fallback summary mode (set GEMINI_API_KEY in server/.env for live Gemini output)');
  }
});

module.exports = app;
