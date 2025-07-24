// javascript
// Purpose: Updated room routes to proxy /recommend endpoint to Flask server, restricted to tenants, preserving existing routes.
const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Room = require('../models/Room');
const Category = require('../models/Category');
const User = require('../models/User');
const { authMiddleware, restrictTo } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Proxy Nominatim geocoding requests to avoid CORS issues
router.get('/geocode', async (req, res) => {
  try {
    const { q, format = 'json', limit = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q, format, limit },
      headers: {
        'User-Agent': 'RoomRentalPlatform/1.0',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Geocode error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch geocode data' });
  }
});

// Get all categories
router.get('/category', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error('Category fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a category
router.post('/category', authMiddleware, restrictTo('admin'), async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const category = new Category({ name });
    await category.save();
    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    console.error('Category creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room
router.post('/', authMiddleware, restrictTo('landlord'), upload.array('images', 3), async (req, res) => {
  const { title, description, price, address, category, location } = req.body;
  try {
    if (!title || !description || !price || !address || !category || !req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'All required fields, including 1-3 images, must be provided' });
    }
    let coordinates;
    if (location) {
      coordinates = JSON.parse(location).coordinates;
    } else {
      const geoResponse = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          q: address,
          key: process.env.OPENCAGE_API_KEY,
          limit: 1
        }
      });
      if (geoResponse.data.status.code !== 200 || !geoResponse.data.results[0]) {
        console.error('Geocoding error:', geoResponse.data);
        return res.status(400).json({
          message: 'Invalid address',
          details: geoResponse.data.status.message || 'Address not found.'
        });
      }
      const { lat, lng } = geoResponse.data.results[0].geometry;
      coordinates = [lng, lat];
    }
    const images = req.files.map(file => `/Uploads/${file.filename}`);
    const room = new Room({
      title,
      description,
      price,
      location: {
        type: 'Point',
        coordinates,
        address
      },
      category,
      landlord: req.user.id,
      images
    });
    await room.save();
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (err) {
    console.error('Room creation error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().populate('category landlord', 'name email');
    res.json(rooms);
  } catch (err) {
    console.error('Room fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rooms listed by the authenticated landlord
router.get('/my-rooms', authMiddleware, restrictTo('landlord'), async (req, res) => {
  try {
    const rooms = await Room.find({ landlord: req.user.id }).populate('category landlord', 'name email');
    res.json(rooms);
  } catch (err) {
    console.error('Landlord rooms fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Find rooms near a location
router.get('/near', async (req, res) => {
  const { lat, lng, maxDistance } = req.query;
  try {
    const rooms = await Room.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance) || 10000
        }
      }
    }).populate('category landlord', 'name email');
    res.json(rooms);
  } catch (err) {
    console.error('Geo query error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single room details for RoomDetails page
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    const room = await Room.findById(req.params.id).populate('category landlord', 'name email');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (err) {
    console.error('Room fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Proxy route for recommendations
router.post('/recommend', authMiddleware, restrictTo('tenant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const response = await axios.post('http://localhost:5001/recommend', {
      userId: req.user.id,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Recommendation proxy error:', error);
    res.status(500).json({ message: error.response?.data?.message || 'Failed to fetch recommendations' });
  }
});

module.exports = router;