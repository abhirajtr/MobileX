function userFound (req, res, next) {
    req.session.user ? res.redirect('/') : next();
}

module.exports = userFound;