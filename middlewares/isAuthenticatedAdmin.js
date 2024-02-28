function isAuthenticated (req, res, next) {
    req.session.admin? next() : res.redirect('/admin/login');
    // next();
}

module.exports = isAuthenticated;