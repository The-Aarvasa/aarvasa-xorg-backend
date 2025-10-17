const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const photo = profile.photos[0].value;

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            user.name = name;
            user.photo = photo;
            user.isVerified = true;
            await user.save();
          } else {
            user = await User.create({
              email,
              googleId: profile.id,
              name,
              photo,
              isVerified: true,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
