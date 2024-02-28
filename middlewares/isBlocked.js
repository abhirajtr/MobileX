const mongoose = require('mongoose');
const User = require('../models/userModel');

async function isBlocked(req, res, next) {
    if (req.session.user) {
        try {
            // console.log(req.session.user);
            const user = await User.findOne({ _id: req.session.user });
            // console.log(user.isBlocked);
            if (user.isBlocked) {
                delete req.session.user;
                return res.redirect('/');
            }
            next();
        } catch (error) {
            console.error(error);
        }
    } else {
        next();
    }
}

module.exports = isBlocked;