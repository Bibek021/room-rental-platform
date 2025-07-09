// Purpose: Mongoose schema for tenant room rental requests
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // Purpose: Reference to the room being requested
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  // Purpose: Reference to the tenant making the request
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Purpose: Request status with valid values (pending, approved, rejected)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], // Fixed to ensure 'approved' is included
    default: 'pending'
  },
  // Purpose: Timestamp for request creation
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);