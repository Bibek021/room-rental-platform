const express = require('express');
const router = express.Router();
const axios = require('axios');
const Room = require('../models/Room');
const Category = require('../models/Category');
const { authMiddleware, restrictTo } = require('../middleware/auth');

// Create a category (admin only)
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

// Create a room (landlord only)
router.post('/', authMiddleware, restrictTo('landlord'), async (req, res) => {
  const { title, description, price, address, category, images } = req.body;
  try {
    if (!title || !description || !price || !address || !category) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    // Geocode address using OpenCage
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
        details: geoResponse.data.status.message || 'Address not found. Try including city and country (e.g., 123 Main St, New York, NY).'
      });
    }
    const { lat, lng } = geoResponse.data.results[0].geometry;
    const room = new Room({
      title,
      description,
      price,
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
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

// Get all rooms (public)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().populate('category landlord', 'name email');
    res.json(rooms);
  } catch (err) {
    console.error('Room fetch error:', err);
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

module.exports = router;