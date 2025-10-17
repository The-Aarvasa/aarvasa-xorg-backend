const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const favSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    property_ids: [
        {
            type: String,
            required: true
        }
    ]
},{ timestamps: true})

const favModel = mongoose.model("Favourite", favSchema);

module.exports = favModel;