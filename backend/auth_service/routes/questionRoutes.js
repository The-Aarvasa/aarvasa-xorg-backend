const express = require("express");
const router = express.Router();
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const sendMail = require("../utils/sendMail");
const Question = require("../models/Question");
const verifyToken = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { question, description } = req.body;
    const name = req.user.name;
    const email = req.user.email;

    if (!question || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let imageUrl = null;
    if (req.file) {
      const streamUpload = (req) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) resolve(result);
            else reject(error);
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await streamUpload(req);
      imageUrl = result.secure_url;
    }

    // Save question to DB
    const newQuestion = await Question.create({
      user: { name, email },
      question,
      description,
      imageUrl,
    });

    // Email content (plain text)
    const mailSubject = `New Question from ${name}`;
    const mailBody = `
New Question Submitted on Aarvasa

Name: ${name}
Email: ${email}
Question: ${question}
Description: ${description}
${imageUrl ? `Image: ${imageUrl}` : ""}
    `.trim();

    // Send email using env-based admin email
    await sendMail(process.env.ADMIN_EMAIL, mailSubject, mailBody);

    res.status(201).json({ message: "Question submitted successfully!" });
  } catch (err) {
    console.error("Error submitting question:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
