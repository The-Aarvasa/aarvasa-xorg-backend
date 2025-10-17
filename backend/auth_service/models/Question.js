const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  user: {
    name: String,
    email: String,
  },
  question: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
