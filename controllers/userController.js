const renderHome = (req, res) => {
    res.render('user/home', { user: false });
}
const renderLogin = (req, res) => {
    res.render('user/login');
}
const renderSignup = (req, res) => {
    res.render('user/signup');
}
const handleSignup = async (req, res) => {
    // console.log(req.body);
    req.session.tempUser = req.body;
    console.log('tempUser', req.session.tempUser);
    res.status(200).json({ status: 'success', redirect: '/verify-email' });
}
const renderVerifyEmail = (req, res) => {
    
}

module.exports = {
    renderHome,
    renderLogin,
    renderSignup,
    handleSignup,
}