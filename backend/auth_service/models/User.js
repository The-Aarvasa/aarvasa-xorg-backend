const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  refreshToken: String,

  // New fields
  name: String,
  photo: String,
  is_subscribed : {
    type : Boolean,
    default : false,
  },
  subscription_type :  {
    type: String,
    default: null,
  },
  subscription_date :  {
    type: String,
    default: null,
  },
  status : {
    type : Boolean,
    default : false,
  },
  otp: String,
  payment_id :  {
    type: String,
    default: null,
  },
  otpExpiry: Date,
});

module.exports = mongoose.model("User", userSchema);
