
const transactionModel = require("../models/Transaction");
exports.transactions = async (req, res) => {
    try {
        const user_id = req.user._id;
        if(!user_id){
            return res.status(401).json({status : false, msg : "Unauthorized"});
        }
        const transactions = await transactionModel.find({ user_id });
        return res.status(200).json({ status: true, transactions: transactions })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error while fetching transactions"
        });
    }
}