const express = require('express');
  const router = express.Router();
  const Request = require('../models/Request');
  const Room = require('../models/Room');
  const { authMiddleware, restrictTo } = require('../middleware/auth');

  // Purpose: Create a request for a room (tenant only)
  router.post('/', authMiddleware, restrictTo('tenant'), async (req, res) => {
    const { room, message } = req.body;
    try {
      if (!room) {
        return res.status(400).json({ message: 'Room ID is required' });
      }
      const roomExists = await Room.findById(room);
      if (!roomExists) {
        return res.status(400).json({ message: 'Invalid room ID' });
      }
      const request = new Request({
        room,
        tenant: req.user.id,
        message: message || '' // Ensure message is saved, empty string if undefined
      });
      await request.save();
      console.log('Request created:', request); // Debug
      res.status(201).json({ message: 'Request created successfully', request });
    } catch (err) {
      console.error('Request creation error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // Purpose: Get requests (landlord: their rooms only, admin: all, exclude message for admin)
  router.get('/', authMiddleware, restrictTo('landlord', 'admin'), async (req, res) => {
    try {
      let requests;
      if (req.user.role === 'landlord') {
        // Fetch requests for rooms owned by the landlord
        requests = await Request.find()
          .populate({
            path: 'room',
            match: { landlord: req.user.id },
            select: 'title location.address price'
          })
          .populate('tenant', 'name email');
        // Filter out requests where room is null (not owned by landlord)
        requests = requests.filter(req => req.room);
        console.log('Landlord requests:', requests); // Debug
      } else {
        // Admin: Fetch all requests, exclude message
        requests = await Request.find()
          .populate('room', 'title location.address price')
          .populate('tenant', 'name email')
          .select('-message');
        console.log('Admin requests:', requests); // Debug
      }
      res.json(requests);
    } catch (err) {
      console.error('Request fetch error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Purpose: Update request status (landlord/admin)
  router.put('/:id', authMiddleware, restrictTo('landlord', 'admin'), async (req, res) => {
    const { status } = req.body;
    try {
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const request = await Request.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      // For landlords, ensure they can only update requests for their rooms
      if (req.user.role === 'landlord') {
        const room = await Room.findById(request.room);
        if (!room || room.landlord.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Unauthorized to update this request' });
        }
      }
      request.status = status;
      await request.save();
      res.json({ message: 'Request updated successfully', request });
    } catch (err) {
      console.error('Request update error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  module.exports = router;