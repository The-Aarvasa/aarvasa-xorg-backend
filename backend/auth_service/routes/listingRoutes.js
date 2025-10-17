const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const router = express.Router();
const {
  getListings,
  getListingById,
  createListing,
  add,
  returnRandom,
  favourites,
  addToRecentlyViewed,
  getFavourites,
  getRecentlyViewed,
  getListingsByIds
} = require("../controllers/listingController");

const upload = require("../middlewares/cloudinaryUpload");

// Define specific routes first
router.get("/add", add);
router.get("/random", returnRandom);

// POST route for creating listings
// Upload multiple photos with field name 'photos'
router.post("/create", upload.array("photos", 10), createListing);

// General listing fetch
router.get("/", getListings);


router.post("/favourite", verifyToken, favourites);
router.get("/getfavourite", verifyToken, getFavourites);

router.post("/by-ids", getListingsByIds);
router.post("/postrecent", verifyToken, addToRecentlyViewed);
router.get("/recent", verifyToken, getRecentlyViewed);

router.get("/:id", getListingById);



module.exports = router;
