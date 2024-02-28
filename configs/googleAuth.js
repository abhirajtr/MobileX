const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy({
    clientID: "1056286311913-ps9rsk9ljlvf4602jibp3lv3jnejcv98.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback",
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