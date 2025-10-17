const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const generateOtp = require("../utils/generateOtp");
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.json({ success: false, msg: "An account already exists with this email" });
  }

  try {
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await sendMail(email, "Verify your email", `Your OTP is: ${otp}`);

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, otp, otpExpiry });
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log(email)
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ msg: "Unauthorized , no user found woth this email" });
  }




  if (user.otp !== otp) {
      return res.status(401).json({ msg: "Invalid or expired OTP" });
    }

  // Clear OTP
 user.otp = ""
 user.otpExpiry = ""

  // Generate Tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  await user.save();

  // Return both tokens
  res.status(200).json({
    message: "OTP verified successfully",
    accessToken,
    refreshToken,
  });
};

// exports.insert = async (req, res) => {
//   const json = {
//     email : "aarvasa_test@gmail.com",
//     password : "aarvasa_test_123",
//   }
//   json.password = await bcrypt.hash(json.password, 10);
//   const user = await new User(json);
//   await user.save();

// }

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid email entered" });
  }

  if (!user.password) {
    return res.status(401).json({ message: "This account was registered via Google. Please sign in with Google." });
  }
 

   const decode = await bcrypt.compare(password, user.password);
    if (!decode) {
      return res.status(401).json({ message: "Invalid email entered" });
    }


  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Store refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // ✅ Send response here
  res.status(200).json({
    username: user.username || "", // or user.name or whatever you store
    is_subscribed: user.is_subscribed,
    plan: user.subscription_type,
    accessToken,
    refreshToken,
  });
};


const otpStore = new Map();

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOtp();
  otpStore.set(email, otp);

  await sendMail(email, "Reset Your Password - Aarvasa", `Your OTP is: ${otp}`);
  res.json({ message: "OTP sent to your email" });
};

//To reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const validOtp = otpStore.get(email);
  if (!validOtp || validOtp !== otp)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { password: hashed });

  otpStore.delete(email);
  res.json({ message: "Password updated successfully" });
};

//for those users who initially loggedin with OAuth But now wanted to login normally
exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password) {
      return res.status(400).json({
        message:
          "Password already set. Please log in using email and password.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message:
        "Password set successfully. You can now log in using email and password.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Find user with matching refresh token
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Issue new access token
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Token expired or invalid" });
  }
};

exports.googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Redirect with tokens (you can also set cookies instead)
    res.redirect(`${process.env.FRONTEND_URL}/signin?accessToken=${accessToken}&refreshToken=${refreshToken}`);

    // To use cookies instead, comment above and uncomment below:
    /*
    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: 'Lax', secure: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'Lax', secure: true });
    res.redirect(`${process.env.FRONTEND_URL}/signin`);
    */
  } catch (err) {
    console.error("Google auth error:", err);
    res.redirect(`${process.env.FRONTEND_URL}/signin?error=google_auth_failed`);
  }
};

exports.getCurrentUser = (req, res) => {
  const user = req.user;
  res.json({
    email: user.email,
    name: user.name,
    picture: user.picture,
    givenName: user.givenName,
    familyName: user.familyName,
    locale: user.locale,
    googleId: user.googleId,
    isVerified: user.isVerified
  });
};
