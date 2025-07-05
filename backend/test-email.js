require('dotenv').config();
const nodemailer = require('nodemailer');

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

const mailOptions = {
  from: process.env.EMAIL,
  to: 'bibekpandit28@gmail.com', // Your email
  subject: 'Test Email from Room Rental Platform',
  text: 'This is a test email.',
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Email error:', err);
  } else {
    console.log('Email sent:', info.response);
  }
});