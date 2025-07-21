const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Room = require('../models/Room');
const User = require('../models/User');
const { authMiddleware, restrictTo } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Purpose: Configure Nodemailer for sending email notifications
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Purpose: Send email notification to tenants for request status
const sendEmail = async (to, subject, text) => {
  console.log(`Attempting to send email to ${to} with subject: ${subject}`);
  console.log(`Using EMAIL: ${process.env.EMAIL}, EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '****' : 'undefined'}`);
  try {
    await transporter.sendMail({
      from: `"RoomFinder" <${process.env.EMAIL}>`,
      to,
      subject,
      text
    });
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (err) {
    console.error(`Email error for ${to}:`, err.message, err.stack);
    return { success: false, error: `Failed to send email to ${to}: ${err.message}` };
  }
};

// Purpose: Create a request for a room, setting landlord from Room document
router.post('/', authMiddleware, restrictTo('tenant'), async (req, res) => {
  const { room, message } = req.body;
  try {
    if (!room || !mongoose.isValidObjectId(room)) {
      console.log(`Invalid room ID: ${room}`);
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    const roomExists = await Room.findById(room).populate('landlord', '_id');
    if (!roomExists) {
      console.log(`Room not found: ${room}`);
      return res.status(400).json({ message: 'Room not found' });
    }
    if (!roomExists.isAvailable) {
      console.log(`Room unavailable: ${room}`);
      return res.status(400).json({ message: 'Room is unavailable' });
    }
    if (!roomExists.landlord || !roomExists.landlord._id) {
      console.log(`Landlord not found for room: ${room}`);
      return res.status(400).json({ message: 'Landlord not found for this room' });
    }
    const request = new Request({
      room,
      tenant: req.user.id,
      landlord: roomExists.landlord._id, // Purpose: Set landlord from Room document
      message: message || ''
    });
    await request.save();
    console.log('Request created:', {
      _id: request._id,
      room: request.room,
      tenant: request.tenant,
      landlord: request.landlord,
      message: request.message,
      status: request.status
    });
    res.status(201).json({ message: 'Request created successfully', request });
  } catch (err) {
    console.error('Request creation error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Purpose: Get requests (landlord: their rooms only, admin: all, exclude message for admin)
router.get('/', authMiddleware, restrictTo('landlord', 'admin'), async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'landlord') {
      requests = await Request.find()
        .populate({
          path: 'room',
          match: { landlord: req.user.id },
          select: 'title location.address price'
        })
        .populate('tenant', 'name email');
      requests = requests.filter(req => req.room);
      console.log('Landlord requests:', requests);
    } else {
      requests = await Request.find()
        .populate('room', 'title location.address price')
        .populate('tenant', 'name email')
        .select('-message');
      console.log('Admin requests:', requests);
    }
    res.json(requests);
  } catch (err) {
    console.error('Request fetch error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Purpose: Accept a request, mark room as unavailable, reject other requests, and send notifications
router.put('/accept/:id', authMiddleware, restrictTo('landlord'), async (req, res) => {
  try {
    console.log(`Attempting to accept request ID: ${req.params.id}`);
    if (!mongoose.isValidObjectId(req.params.id)) {
      console.log(`Invalid request ID: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    const request = await Request.findById(req.params.id).populate([
      { path: 'room', select: 'title _id isAvailable landlord' },
      { path: 'tenant', select: 'name email' }
    ]);
    if (!request) {
      console.log(`Request not found: ${req.params.id}`);
      return res.status(400).json({ message: 'Request not found' });
    }
    if (!request.room || !request.room.landlord) {
      console.log(`Room or landlord data missing for request: ${req.params.id}`);
      return res.status(400).json({ message: 'Room or landlord data missing' });
    }
    // Purpose: Use room.landlord for authorization if request.landlord is missing
    if (request.room.landlord.toString() !== req.user.id) {
      console.log(`Unauthorized access for request: ${req.params.id}, landlord: ${request.room.landlord}, user: ${req.user.id}`);
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (request.status !== 'pending') {
      console.log(`Request already processed: ${req.params.id}, status: ${request.status}`);
      return res.status(400).json({ message: `Request already processed (status: ${request.status})` });
    }
    if (!request.tenant || !request.tenant.email) {
      console.log(`Tenant data missing for request: ${req.params.id}`);
      return res.status(400).json({ message: 'Tenant data missing' });
    }

    // Purpose: Set landlord if missing to ensure compatibility
    if (!request.landlord) {
      request.landlord = request.room.landlord;
    }
    request.status = 'approved';
    await request.save();
    console.log(`Request approved: ${req.params.id}`);

    // Mark room as unavailable
    const room = await Room.findById(request.room._id);
    if (!room) {
      console.log(`Room not found: ${request.room._id}`);
      return res.status(400).json({ message: 'Room not found' });
    }
    room.isAvailable = false;
    await room.save();
    console.log(`Room marked unavailable: ${request.room._id}`);

    // Update other requests for this room to rejected
    const otherRequests = await Request.find({
      room: request.room._id,
      _id: { $ne: request._id },
      status: 'pending'
    }).populate([
      { path: 'tenant', select: 'name email' },
      { path: 'room', select: 'title' }
    ]);
    const emailErrors = [];
    for (const otherRequest of otherRequests) {
      if (!otherRequest.tenant || !otherRequest.tenant.email) {
        console.log(`Tenant email missing for other request: ${otherRequest._id}`);
        emailErrors.push(`Tenant email missing for request ${otherRequest._id}`);
        continue;
      }
      // Purpose: Set landlord if missing for other requests
      if (!otherRequest.landlord) {
        otherRequest.landlord = request.room.landlord;
      }
      otherRequest.status = 'rejected';
      await otherRequest.save();
      console.log(`Rejected other request: ${otherRequest._id}`);
      const emailResult = await sendEmail(
        otherRequest.tenant.email,
        'Room Request Rejected',
        `Dear ${otherRequest.tenant.name || 'Tenant'},\n\nYour request for the room "${otherRequest.room?.title || 'Unknown'}" has been rejected as another tenant's request was accepted.\n\nThank you,\nRoomFinder Team`
      );
      if (!emailResult.success) {
        emailErrors.push(emailResult.error);
      }
    }

    // Send acceptance email
    const landlord = await User.findById(request.room.landlord);
    const acceptEmailResult = await sendEmail(
      request.tenant.email,
      'Room Request Accepted',
      `Dear ${request.tenant.name || 'Tenant'},\n\nYour request for the room "${request.room.title}" has been accepted! Please contact the landlord (${landlord.email || 'unknown'}) for next steps.\n\nThank you,\nRoomFinder Team`
    );
    if (!acceptEmailResult.success) {
      emailErrors.push(acceptEmailResult.error);
    }

    // Respond with success, including any email errors
    res.json({
      message: 'Request accepted, room updated',
      request,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined
    });
  } catch (err) {
    console.error('Accept request error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Purpose: Reject a request and send rejection email
router.put('/reject/:id', authMiddleware, restrictTo('landlord'), async (req, res) => {
  try {
    console.log(`Attempting to reject request ID: ${req.params.id}`);
    if (!mongoose.isValidObjectId(req.params.id)) {
      console.log(`Invalid request ID: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    const request = await Request.findById(req.params.id).populate([
      { path: 'room', select: 'title landlord' },
      { path: 'tenant', select: 'name email' }
    ]);
    if (!request) {
      console.log(`Request not found: ${req.params.id}`);
      return res.status(400).json({ message: 'Request not found' });
    }
    if (!request.room || !request.room.landlord) {
      console.log(`Room or landlord data missing for request: ${req.params.id}`);
      return res.status(400).json({ message: 'Room or landlord data missing' });
    }
    // Purpose: Use room.landlord for authorization if request.landlord is missing
    if (request.room.landlord.toString() !== req.user.id) {
      console.log(`Unauthorized access for request: ${req.params.id}, landlord: ${request.room.landlord}, user: ${req.user.id}`);
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (request.status !== 'pending') {
      console.log(`Request already processed: ${req.params.id}, status: ${request.status}`);
      return res.status(400).json({ message: `Request already processed (status: ${request.status})` });
    }
    if (!request.tenant || !request.tenant.email) {
      console.log(`Tenant data missing for request: ${req.params.id}`);
      return res.status(400).json({ message: 'Tenant data missing' });
    }

    // Purpose: Set landlord if missing to ensure compatibility
    if (!request.landlord) {
      request.landlord = request.room.landlord;
    }
    request.status = 'rejected';
    await request.save();
    console.log(`Request rejected: ${req.params.id}`);

    // Send rejection email
    const emailResult = await sendEmail(
      request.tenant.email,
      'Room Request Rejected',
      `Dear ${request.tenant.name || 'Tenant'},\n\nYour request for the room "${request.room.title}" has been rejected.\n\nThank you,\nRoomFinder Team`
    );

    // Respond with success, including any email errors
    res.json({
      message: 'Request rejected',
      request,
      emailError: emailResult.success ? undefined : emailResult.error
    });
  } catch (err) {
    console.error('Reject request error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;