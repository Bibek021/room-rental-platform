// javascript
// Purpose: Updated Express server to include user routes for preferences, preserving existing routes and middleware.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Import route handlers
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const requestRoutes = require('./routes/request');
const userRoutes = require('./routes/user');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Serve static files from uploads
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/user', userRoutes);

// Root endpoint
app.get('/', (req, res) => res.send('Room Rental Backend'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));