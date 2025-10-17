const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;


// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use SMTP if needed
  auth: {
    user: process.env.EMAIL_USER,     // Your sending email
    pass: process.env.EMAIL_PASS      // App password (not your Gmail password)
  }
});

router.post('/', async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  try {
    // Save to DB
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already subscribed' });
    }

    const subscriber = new Subscriber({ email });
    await subscriber.save();

    // Send email notification to admin
    await transporter.sendMail({
      from: `"Newsletter" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: 'New Newsletter Subscription To Aarvasa',
      text: `New subscriber to Aarvasa: ${email}`,
    });

    res.status(200).json({ success: true, message: 'Subscribed and notified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
