const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  propertyTitle: { type: String, required: true },
  price: { type: Number, required: true },
  priceD: { type: String, required: true },
  postedDate: { type: Date, required: true },

  city: String,
  location: String,
  transactionType: String,
  propertyType: String,

  carpetArea: String, // string because it's not always a number (e.g. "NA")
  carpetAreaUnit: String,
  sqFtPrice: Number,

  bedrooms: String,
  bathrooms: String,
  balconies: String,
  floor: String,
  flooringType: String,
  furnished: String,
  ownershipType: String,
  facing: String,
  amenFacing: String,
  powerStatus: String,
  waterStatus: String,
  parking: String,

  bookingAmount: Number,
  maintenanceCharges: String, // sometimes stored as string
  maintenanceFreq: String,
  possessionStatus: String,

  isPrimeLocation: { type: Boolean, default: false },
  approvedAuthority: String,
  newConstruction: String,

  imageUrls: [String],
  thumbnailImages: [String],

  coordinates: {
    lat: String,
    lng: String
  },



  detailedDescription: String,
  shortDescription: String,

  agent: {
    name: String,
    contactName: String,
    companyName: String,
    operatingSince: String,
    buyersServed: String
  },

  listingType : {
    type : String,
  },

  amenities: {
    luxury: [String],
    nonLuxury: [String]
  },

  nearbyLandmarks: [String],
  tenantPreference: String,
  reviews: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("Property", listingSchema);
