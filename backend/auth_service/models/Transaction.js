const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["APARTMENT", "VILLA"],
    required: true
  },
  price: {
    type: String, // keeping as string to handle values like "1.5 khs", "₹ 700 kh"
    required: true
  },
  area: {
    type: Number, // in sq.ft
    required: true
  },
  user_id : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required : true
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
