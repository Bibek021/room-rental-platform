require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authMiddleware, restrictTo } = require('../middleware/auth');

console.log('auth.js - EMAIL:', process.env.EMAIL);
console.log('auth.js - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error('Transporter error:', err);
  } else {
    console.log('Transporter ready:', success);
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!['admin', 'landlord', 'tenant'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    user = new User({
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

router.get('/protected', authMiddleware, restrictTo('admin', 'landlord'), (req, res) => {
  res.json({ message: `Hello ${req.user.role}, this is a protected route!` });
});

module.exports = router;