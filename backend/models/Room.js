const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  amenities: [String],
  images: [String],
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdAt: { type: Date, default: Date.now }
});
roomSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Room', roomSchema);