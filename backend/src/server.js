const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { seedAdmin } = require('./database/seed');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const photoRoutes = require('./routes/photoRoutes');
const journalRoutes = require('./routes/journalRoutes');
const sharingRoutes = require('./routes/sharingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors({
  origin: '*', // Allows local frontend dev server
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (avatars, covers, photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Travel Planner & Live Travel Journal API',
    timestamp: new Date().toISOString()
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api', journeyRoutes); // includes /days, /destinations, /exploration
app.use('/api/expenses', expenseRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server and seed initial admin
app.listen(PORT, async () => {
  console.log(`🚀 Travel Planner Backend running on http://localhost:${PORT}`);
  await seedAdmin();
});
