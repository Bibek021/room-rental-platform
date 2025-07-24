// javascript
// Purpose: Updated User model to include preferences and viewedRooms for recommendations, preserving OTP fields.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false // Optional for admin
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'landlord', 'tenant'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  preferences: {
    maxPrice: { type: Number, default: 1000000 },
    preferredLocations: [{ type: String }],
    preferredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  },
  viewedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);