// routes/contactRoutes.js
const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const sendMail = require("../utils/sendMail");

router.get("/", (req, res) => {
  res.send("Hii");
})

router.post("/", async (req, res) => {
  const { name, email, date } = req.body;

  if (!name || !email || !date) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    // Save to MongoDB
    const contact = new Contact({
      name,
      email,
      date: new Date(date),
    });
    await contact.save();

    // Send Email to Admin
    const subject = "New Contact Form Submission To Aarvasa";
    const text = `
New Contact Submission

Name: ${name}
Email: ${email}
Date: ${new Date(date).toDateString()}
    `;

    await sendMail(process.env.ADMIN_EMAIL, subject, text);

    res
      .status(200)
      .json({ msg: "Contact form submitted and email sent to admin." });
  } catch (err) {
    console.error("Contact submission error:", err);
    res.status(500).json({ msg: "Server error. Could not submit form." });
  }
});

module.exports = router;
