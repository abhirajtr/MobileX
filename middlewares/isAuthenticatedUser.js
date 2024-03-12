function isAuthenticated(req, res, next) {
    req.session.user ? next(): res.redirect('/login');
}

module.exports = isAuthenticated;