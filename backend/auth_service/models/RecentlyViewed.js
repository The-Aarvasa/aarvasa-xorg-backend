const mongoose = require("mongoose");

const recentViewSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  property_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const RecentViewed = mongoose.model("RecentlyViewed", recentViewSchema);
module.exports = RecentViewed;
