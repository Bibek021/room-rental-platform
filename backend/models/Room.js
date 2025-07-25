const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: array => array.length > 0 && array.length <= 3,
      message: '1 to 3 images are required'
    }
  },
  isAvailable: { // Purpose: Track room availability for hiding accepted rooms (new feature)
    type: Boolean,
    default: true
  }
}, { timestamps: true });

roomSchema.index({ location: '2dsphere' }); // Purpose: Geospatial index for location-based queries (existing feature, unchanged)

module.exports = mongoose.model('Room', roomSchema);