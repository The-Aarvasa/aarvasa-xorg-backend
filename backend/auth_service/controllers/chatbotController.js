const axios = require("axios");

exports.chat=async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await axios.post(`${process.env.CHATBOT_URL}/chat`, {
      message,
      history,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to connect to chatbot", details: err.message });
  }
}