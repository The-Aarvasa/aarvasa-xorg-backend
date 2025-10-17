const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const User = require("../models/User");
const verifyToken = require("../middlewares/authMiddleware");
router.post("/create-order", verifyToken, async (req, res) => {
    const { amount } = req.body;


    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET
    });


    const options = {
        amount: amount * 100, // amount in paise
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
        res.status(500).send("Error creating order");
    }
});

router.post("/markUser", async (req, res) => {
    const { email, payment_id, subscription_type,  subscription_date } = req.body;
        if(!email){
        return res.json({msg : "email not found", status : false});
    }
   try{
     const update = await User.updateOne(
        { email: email },
        {
            $set: {
                payment_id : payment_id,
                status: true,
                is_subscribed : true,
                subscription_type: subscription_type,
                subscription_date: new Date()
            }
        }
    )
    res.json({status : true, msg : "User subscribed"})
   }
   catch(error){
    console.log(error);
   }

});


module.exports = router;