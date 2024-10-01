const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    passReqToCallback: true,
},
    function (request, asscessToken, refreshToken, profile, done) {

        // console.log(profile);
        User.findOne({ email: profile.emails[0].value }).then((user) => {
            if (user) {
                
                return done(null, user);
            } else {
                const newUser = new User({
                    // googleId: profile.id,
                    username: profile.displayName,
                    email: profile.emails[0].value
                });
                newUser.save().then((newUser) => {
                    
                    return done(null, newUser);
                }).catch((err) => {
                    return done(err);
                })
            }
        })
    }
));
passport.serializeUser(function (user, done) {
    done(null, user)
})
passport.deserializeUser(function (user, done) {
    done(null, user)
})
