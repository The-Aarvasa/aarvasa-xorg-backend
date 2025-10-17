const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");

dotenv.config();
connectDB();

require("./config/passport");

const app = express();
app.set('trust proxy', 1);

app.use(helmet());

// CORS 
app.use(cors({
  origin: [ process.env.FRONTEND_URL, "http://localhost:5173"], 
  credentials: true
}));

// Accept JSON payloads
app.use(express.json());

// Session middleware (used by passport)
app.use(session({
  secret: "otpsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,          // true if using HTTPS
    httpOnly: true,
    sameSite: "lax"         // or "none" if you're on HTTPS + cross-site
  }
}));

app.use(passport.initialize());
app.use(passport.session());


app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use('/api/listings', require("./routes/listingRoutes"));
app.use('/api/subscribe', require('./routes/newsletterRoutes'));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes.js"));
app.use("/api/user", require("./routes/userRoute.js"));
app.use("/api/question",require("./routes/questionRoutes.js"));

app.get("/", (req, res) => {
  res.send("ok");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
