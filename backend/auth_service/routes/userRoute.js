const express = require("express");
const { transactions } = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/transactions", verifyToken, transactions);

module.exports = router;