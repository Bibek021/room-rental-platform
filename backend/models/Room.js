const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: { type: String, required: true } // Store human-readable address
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

roomSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Room', roomSchema);