// javascript
// Purpose: Backend routes for user-related operations, including updating tenant preferences for recommendations.
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, restrictTo } = require('../middleware/auth');

// Update tenant preferences
router.put('/preferences', authMiddleware, restrictTo('tenant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferences = {
      maxPrice: req.body.maxPrice || user.preferences.maxPrice,
      preferredLocations: req.body.preferredLocations || user.preferences.preferredLocations,
      preferredCategories: req.body.preferredCategories || user.preferences.preferredCategories,
    };

    await user.save();
    res.json({ message: 'Preferences updated successfully', preferences: user.preferences });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Get user profile (for frontend to fetch preferences)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

module.exports = router;