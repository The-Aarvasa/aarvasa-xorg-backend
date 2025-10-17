const Listing = require("../models/Listing");
const redisClient = require("../config/redisClient");
const crypto = require("crypto");
const axios = require("axios");
const FavModel = require("../models/Fav");
const RecentViewed = require("../models/RecentlyViewed");

// 📦 GET All Listings (with Redis + Filters)
exports.getListings = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;

    // Redis key based on filters
    // const key = crypto
    //   .createHash("md5")
    //   .update(JSON.stringify(req.query))
    //   .digest("hex");

    // const cachedData = await redisClient.get(key);
    // if (cachedData) {
    //   console.log("🔁 Listings returned from Redis");
    //   return res.status(200).json(JSON.parse(cachedData));
    // }

    // Mongo query
    const query = {};

    console.log("Search keyword received:", filters.city, typeof filters.city);

    // Search only in propertyTitle
    if (filters.city && typeof filters.city === "string" && filters.city.trim() !== "") {
      query.propertyTitle = { $regex: filters.city, $options: "i" };
    }

    if (filters.propertyType && filters.propertyType !== "All") {
      query.propertyType = filters.propertyType;
    }

    if (filters.transactionType && filters.transactionType !== "All") {
      query.transactionType = filters.transactionType;
    }

    if (filters.budget) {
      query.price = { $lte: parseInt(filters.budget) };
    }

    // Fetch listings with pagination
    const listings = await Listing.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Total count for pagination
    const total = await Listing.countDocuments(query);


    // Cache it for 5 minutes
    // await redisClient.setEx(key, 300, JSON.stringify(listings));

    // console.log("✅ Listings fetched from Mongo and cached");
    res.status(200).json({
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      listings,
    });
  } catch (err) {
    console.error("❌ Error in getListings:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 📦 GET Listing By ID (with Redis)
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const cached = await redisClient.get(id);
    if (cached) {
      console.log("📦 Detail returned from Redis");
      return res
        .status(200)
        .json({ status: true, data: JSON.parse(cached), msg: "From Redis" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    await redisClient.setEx(id, 300, JSON.stringify(listing));

    return res.status(200).json({ status: true, data: listing });
  } catch (err) {
    console.error("❌ Error in getListingById:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧪 GET Random Listings
exports.returnRandom = async (req, res) => {
  try {
    const listings = await Listing.aggregate([{ $sample: { size: 5 } }]);
    res.status(200).json({ listings, status: true });
  } catch (err) {
    console.error("❌ Error in returnRandom:", err);
    res.status(500).json({ error: "Failed to fetch random listings" });
  }
};

// 🌐 ADD via MagicBricks Scraper (for internal/testing)
exports.add = async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.magicbricks.com/mbsrp/propertySearch.html?editSearch=Y&category=S&bedrooms=11701,11702&city=5196&page=2&groupstart=30&offset=0&maxOffset=503&sortBy=premiumRecent&postedSince=-1&pType=10002,10003,10021,10022,10001,10017&isNRI=N&multiLang=en&propertyType=10017&keywords=premium,luxury"
    );

    const data = response.data.resultList || [];

    const propertiesToSave = data.map((item) => ({
      propertyTitle: item.propertyTitle,
      price: item.price,
      priceD: item.priceD,
      postedDate: new Date(item.postDateT),
      city: item.ctName,
      location: item.lmtDName,
      transactionType: item.transactionTypeD,
      propertyType: item.propTypeD,
      carpetArea: item.carpetArea || item.ca,
      carpetAreaUnit: "Sq-ft",
      sqFtPrice: item.sqFtPrice,
      bedrooms: item.bedroomD,
      bathrooms: item.bathD,
      balconies: item.balconiesD,
      floor: item.floorD,
      flooringType: item.flooringTyD,
      furnished: item.furnishedD,
      ownershipType: item.ownershipTypeD,
      facing: item.facingD,
      amenFacing: item.amenFacingD,
      powerStatus: item.powerStatusD,
      waterStatus: item.waterStatus,
      parking: item.parkingD,
      bookingAmount: Number(item.bookingAmtExact || 0),
      maintenanceCharges: item.maintenanceCharges,
      maintenanceFreq: item.maintenanceD,
      possessionStatus: item.possStatusD,
      isPrimeLocation: item.isPrimeLocProp === "Y",
      newConstruction: item.acD,
      imageUrls: item.allImgPath || [],
      thumbnailImages: item.propertyImageNew
        ? item.propertyImageNew.split(",")
        : [],
      coordinates: {
        lat: parseFloat(item.pmtLat) || 0,
        lng: parseFloat(item.pmtLong) || 0,
      },
      detailedDescription: item.pmtUsp,
      shortDescription: item.pmtUspWap,
      agent: {},
      amenities: {},
      nearbyLandmarks: [],
      tenantPreference: item.tenantsPreference,
      reviews: [],
    }));

    await Listing.insertMany(propertiesToSave);

    return res.status(200).json({
      message: "Properties saved successfully",
      count: propertiesToSave.length,
    });
  } catch (error) {
    console.error("❌ Scraping error:", error.message);
    res.status(500).json({ error: "Scraping failed" });
  }
};

// POST /api/listings/by-ids
exports.getListingsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const properties = await Listing.find({ _id: { $in: ids } });
    res.status(200).json(properties);
  } catch (err) {
    console.error("Error in getListingsByIds:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.createListing = async (req, res) => {
  try {
    const body = req.body;
    console.log("📥 Incoming listing payload:", body);

    const uploadedImages = req.files?.length
      ? req.files.map((file) => file.path)
      : JSON.parse(body.photos || "[]");

    const {
      propertyType,
      transactionType,
      listingType,
      propertyTitle,
      location,
      coordinates,
      imageFiles, // optional if uploaded separately
      bedrooms,
      bathrooms,
      balcony,
      price,
      unit,
      shortDescription,
      detailedDescription,
      carpetArea,
      carpetAreaUnit,
      totalPerSq,
      floor,
      facing,
      ownershipType,
      nearbyLandmarks,
      furnished,
      plotSize,
      facilities,
    } = req.body;

    console.log("req data = ", req.body);



    const parsedLocation = {
      address: location,
    };

    const parsedCoordinates =
      typeof coordinates === "string" ? JSON.parse(coordinates) : coordinates;
    const parsedFacilities =
      typeof facilities === "string" ? JSON.parse(facilities) : facilities;
    let amount = totalPerSq ? totalPerSq : price;

    const newProperty = new Listing({
      propertyTitle,
      price: Number(amount),
      priceD: Number(amount),
      postedDate: new Date(),
      nearbyLandmarks: Array.isArray(nearbyLandmarks)
        ? nearbyLandmarks
        : typeof nearbyLandmarks === 'string'
          ? JSON.parse(nearbyLandmarks)
          : [],

      transactionType: transactionType,
      propertyType: propertyType,
      carpetArea: plotSize,
      location: parsedLocation?.address || "",
      city: parsedLocation?.address?.split(",")?.slice(-2)?.[0]?.trim() || "",

      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      balconies: Number(balcony),

      imageUrls: uploadedImages,
      thumbnailImages: uploadedImages,

      coordinates: {
        lat: parsedCoordinates?.lat || 0,
        lng: parsedCoordinates?.lng || 0,
      },

      amenities: {
        nonLuxury: Array.isArray(parsedFacilities) ? parsedFacilities : [],
      },

      shortDescription: shortDescription,
      detailedDescription: detailedDescription,
    });

    const saved = await newProperty.save();
    return res.status(201).json({ success: true, listing: saved });
  } catch (error) {
    console.error("❌ Error creating listing:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create listing" });
  }
};


// added favourites

exports.favourites = async (req, res) => {
  try {
    const prop_id = req.body.propertyId;
    const user_id = req.user._id;

    let favDoc = await FavModel.findOne({ user_id });

    if (!favDoc) {
      // If no document, create new one
      const newFav = new FavModel({
        user_id: user_id,
        property_ids: [prop_id]
      });

      await newFav.save();
      return res.status(201).json({ success: true, msg: "Favourite added (new doc)", data: newFav });
    }

    // If document exists, check if already liked
    if (!favDoc.property_ids.includes(prop_id)) {
      favDoc.property_ids.push(prop_id);
      await favDoc.save();
      return res.status(200).json({ success: true, msg: "Favourite added", data: favDoc });
    } else {
      await FavModel.updateOne(
        { user_id: req.user._id },
        { $pull: { property_ids: prop_id } }
      );
      return res.status(200).json({ success: true, msg: "Removed from like" });
    }

  } catch (err) {
    console.error("Error in favourites:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};


// fetching favourites

exports.getFavourites = async (req, res) => {
  try {
    const user_id = req.user._id;
    const favDoc = await FavModel.findOne({ user_id });

    res.status(200).json({
      property_ids: favDoc?.property_ids || []
    });
  } catch (err) {
    console.error("Error getting favourites:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
};




// added recently viewed 

exports.addToRecentlyViewed = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { propertyId } = req.body;

    await RecentViewed.findOneAndUpdate(
      { user_id },
      { $addToSet: { property_ids: propertyId } }, // ensures uniqueness
      { upsert: true, new: true } // create if doesn't exist
    );

    return res.status(200).json({
      status: true,
      message: "Added to recently viewed",
    });
  } catch (err) {
    console.error("Error in recently viewed:", err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};


exports.getRecentlyViewed = async (req, res) => {
  const user_id = req.user._id;

  try {
    const recent = await RecentViewed.findOne({ user_id })
      .populate("property_ids") // Automatically gets full property documents
      .lean(); // Optional: returns plain JS objects instead of Mongoose documents

    if (!recent || !recent.property_ids || recent.property_ids.length === 0) {
      return res.status(200).json({
        status: true,
        data: [],
        msg: "No recently viewed properties",
      });
    }

    return res.status(200).json({
      status: true,
      data: recent.property_ids, // Full property objects
    });

  } catch (err) {
    console.error("❌ Error fetching recently viewed:", err.message);
    return res.status(500).json({
      status: false,
      msg: "Internal server error",
    });
  }
};
