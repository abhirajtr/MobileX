const mongoose = require('mongoose');

const cartCount = (req, res, next) => {
    if (req.session.user) {
        res.locals.cart = req.session.cart;
        // console.log(cart);
    }
    next();
}

module.exports = cartCount;