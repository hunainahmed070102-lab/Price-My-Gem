const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const { connectDB } = require('./config/database');
const { ensureSchemaColumns } = require('./config/ensureSchema');
const errorHandler  = require('./middleware/errorHandler');

const authRoutes     = require('./routes/authRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const adminRoutes    = require('./routes/adminRoutes');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);                   // mobile / curl
    if (process.env.NODE_ENV !== 'production') return callback(null, true); // dev
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success:     true,
    message:     'PriceMyGem API is operational',
    version:     '2.0.0',
    database:    'MySQL (XAMPP)',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString()
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api',       analysisRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;

const startServer = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('\nFailed to connect to MySQL.');
    console.error('Steps to fix:');
    console.error('  1. Open XAMPP Control Panel');
    console.error('  2. Start Apache + MySQL');
    console.error('  3. Run:  node src/config/initDatabase.js');
    console.error('  4. Run:  npm run seed');
    console.error('  5. Then restart the server\n');
    process.exit(1);
  }

  await ensureSchemaColumns();

  app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log(`Database: MySQL (XAMPP) → ${process.env.DB_NAME || 'pricemygem_db'}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

startServer();

module.exports = app;
