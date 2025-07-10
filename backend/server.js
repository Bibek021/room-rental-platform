// Purpose: Initialize Express server and configure middleware, database, and routes
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Purpose: Import route handlers for authentication, rooms, and requests
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const requestRoutes = require('./routes/request'); // Added for Request APIs

// Purpose: Load environment variables from .env file
dotenv.config();

// Purpose: Create Express app instance
const app = express();

// Purpose: Enable CORS for frontend access
app.use(cors());

// Purpose: Parse incoming JSON requests
app.use(express.json());

//Serve static files from uploads for image access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Purpose: Connect to MongoDB Atlas using MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Purpose: Mount API routes
app.use('/api/auth', authRoutes); // Authentication routes (register, login, verify-email)
app.use('/api/room', roomRoutes); // Room routes (create, list, geospatial query)
app.use('/api/request', requestRoutes); // Request routes (create, list, update status)

// Purpose: Root endpoint for basic server check
app.get('/', (req, res) => res.send('Room Rental Backend'));

// Purpose: Start server on specified port (from .env or default 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));