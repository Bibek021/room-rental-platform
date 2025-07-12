const mongoose = require('mongoose');

  const requestSchema = new mongoose.Schema({
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      default: '' // Allow empty string for optional message
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  });

  module.exports = mongoose.model('Request', requestSchema);