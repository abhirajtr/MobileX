const nodemailer = require('../configs/nodemailer')
const generateOTP = require('../configs/generateOTP');

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
    req.session.tempUser = req.body;
    req.session.tempUser.otp = generateOTP();
    console.log('tempUser', req.session.tempUser);
    await nodemailer(req.session.tempUser.email, req.session.tempUser.otp);
    res.status(200).json({ status: 'success', redirect: '/verify-email' });
}
const renderVerifyEmail = (req, res) => {
    req.session.tempUser.createdAt = new Date();
    console.log('tempuser', req.session.tempUser);
    res.render('user/verify-email', { email: req.session.tempUser.email });
}
const handleVerifyEmail = (req, res) => {
    if (!req.session.tempUser) {
        res.status(404).json({ error: 'session expired', redirect: '/signup' });
        return console.log('no sesssion');
    }
    console.log(req.body);
    const createdAt = new Date(req.session.tempUser.createdAt);
    console.log('createdAt', createdAt);
    console.log(req.session.tempUser.createdAt);
    const currentTime = Date.now();
    console.log('currentTime', currentTime);
    const differenceInSeconds = (currentTime - createdAt.getTime()) / 1000;
    console.log('differenceInSeconds', differenceInSeconds);
    if (differenceInSeconds < 60) {
        if (req.session.tempUser.otp == req.body.enteredOtp) {
            return res.status(200).json({ status: 'success', redirect: '/login' });
        }
        return res.status(404).json({ status: 'failed', error: 'Incorrect OTP' });
    }
    delete req.session.tempUser.otp;
    res.status(400).json({ error: 'OTP expired' });
}
const handleResendOtp = async (req, res) => {
    req.session.tempUser.otp = generateOTP();
    await nodemailer(req.session.tempUser.email, req.session.tempUser.otp);
    req.session.tempUser.createdAt = Date.now();
    res.status(200).json({ message: 'OTP resend success' })
}

module.exports = {
    renderHome,
    renderLogin,
    renderSignup,
    handleSignup,
    renderVerifyEmail,
    handleVerifyEmail,
    handleResendOtp
}