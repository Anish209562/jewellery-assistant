/**
 * AI-Powered Jewellery Manufacturing Assistant
 * Backend Server — Express + MongoDB
 */

require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const workerRoutes = require('./routes/workerRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5174').trim();
const allowedOrigins = Array.from(new Set([clientUrl, 'http://localhost:5173', 'http://localhost:5174']));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.emit('socket:ready', { success: true, message: 'Realtime updates connected' });
});

// ─── Middleware ───────────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — allow requests from the React frontend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Request logging (only in dev)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Jewellery Assistant API is running ✨', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler (Express 5 compatible — use explicit pattern)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Database + Server Start ──────────────────────────────────────────────────

const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewellery-assistant';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
