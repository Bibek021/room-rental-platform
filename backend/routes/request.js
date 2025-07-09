const express = require('express');
  const router = express.Router();
  const Request = require('../models/Request');
  const Room = require('../models/Room');
  const { authMiddleware, restrictTo } = require('../middleware/auth');

  // Purpose: Create a rental request (tenant only)
  router.post('/', authMiddleware, restrictTo('tenant'), async (req, res) => {
    const { roomId } = req.body;
    try {
      // Purpose: Validate input and room existence
      if (!roomId) {
        return res.status(400).json({ message: 'Room ID is required' });
      }
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      // Purpose: Create request with tenant's user ID
      const request = new Request({
        room: roomId,
        tenant: req.user.id,
        status: 'pending'
      });
      await request.save();
      res.status(201).json({ message: 'Request created successfully', request });
    } catch (err) {
      console.error('Request creation error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // Purpose: List requests for landlord (own rooms) or admin (all requests)
  router.get('/', authMiddleware, restrictTo('landlord', 'admin'), async (req, res) => {
    try {
      let requests;
      if (req.user.role === 'landlord') {
        // Purpose: Fetch requests for rooms owned by the landlord
        requests = await Request.find()
          .populate({
            path: 'room',
            match: { landlord: req.user.id },
            populate: { path: 'category', select: 'name' }
          })
          .populate('tenant', 'email');
        // Purpose: Filter out null rooms (non-landlord rooms)
        requests = requests.filter(req => req.room);
      } else {
        // Purpose: Fetch all requests for admin
        requests = await Request.find()
          .populate('room', 'title location')
          .populate('tenant', 'email');
      }
      res.json(requests);
    } catch (err) {
      console.error('Request fetch error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // Purpose: Update request status (landlord/admin only)
  router.put('/:id', authMiddleware, restrictTo('landlord', 'admin'), async (req, res) => {
    const { status } = req.body;
    try {
      // Purpose: Validate input
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
      }
      // Purpose: Find request and verify ownership (for landlord)
      const request = await Request.findById(req.params.id).populate('room');
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      if (req.user.role === 'landlord' && request.room.landlord.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Purpose: Update status
      request.status = status;
      await request.save();
      res.json({ message: 'Request updated successfully', request });
    } catch (err) {
      // Purpose: Handle validation errors specifically
      if (err.name === 'ValidationError') {
        console.error('Request update validation error:', err);
        return res.status(400).json({ message: 'Invalid status value', error: err.message });
      }
      console.error('Request update error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  module.exports = router;