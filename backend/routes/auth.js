require('dotenv').config();
  const express = require('express');
  const router = express.Router();
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const nodemailer = require('nodemailer');
  const User = require('../models/User');
  const { authMiddleware } = require('../middleware/auth');

  // Debug environment variables
  console.log('auth.js - EMAIL:', process.env.EMAIL);
  console.log('auth.js - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify transporter
  transporter.verify((err, success) => {
    if (err) {
      console.error('Transporter error:', err);
    } else {
      console.log('Transporter ready:', success);
    }
  });

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Purpose: Register a new user
  router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required' });
      }
      if (!['admin', 'landlord', 'tenant'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      if (['landlord', 'tenant'].includes(role) && !name) {
        return res.status(400).json({ message: 'Name is required for landlord and tenant roles' });
      }
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const otp = generateOTP();
      const otpExpires = Date.now() + 10 * 60 * 1000;
      user = new User({
        name: name || undefined,
        email,
        password: await bcrypt.hash(password, 10),
        role,
        isVerified: false,
        otp,
        otpExpires,
      });
      await user.save();
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Verify Your Email - Room Rental Platform',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      };
      await transporter.sendMail(mailOptions);
      res.status(201).json({ message: 'User registered. Please verify your email with the OTP sent.' });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Purpose: Verify OTP
  router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
      if (user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.json({ token, role: user.role, message: 'Email verified successfully' });
    } catch (err) {
      console.error('Verify email error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Purpose: Login user
  router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
      if (!email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      if (!user.isVerified) {
        return res.status(400).json({ message: 'Please verify your email first' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch || user.role !== role) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.json({ token, role });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Purpose: Get user profile
  router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('name email role');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      console.error('Profile fetch error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // backend/routes/auth.js
router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('role name email');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      console.error('User fetch error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  module.exports = router;