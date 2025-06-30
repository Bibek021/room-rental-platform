const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Room Rental Platform - Verify Your Email',
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };