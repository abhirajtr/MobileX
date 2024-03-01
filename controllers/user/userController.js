const nodemailer = require('../../configs/nodemailer')
const generateOTP = require('../../configs/generateOTP');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Address = require('../../models/addressModel');

const renderHome = async (req, res) => {
    try {
        // console.log('1',req.session);
        if (req.session.passport) {
            req.session.user = req.session.passport.user._id;
        }
        const products = await Product.find({ isBlocked: false });
        // console.log(products);
        // req.session.user ? res.render('user/home', { user: req.session.user, products }) : res.render('user/home', { products });
        res.render('user/home', { products, user: req.session.user ? req.session.user : false });
    } catch (error) {
        console.error(error);
    }
}
const renderProductDetails = async (req, res) => {
    try {
        const productDetails = await Product.findById(req.query.id);
        // console.log(productDetails);
        res.render('user/product-details', { user: req.session.user ? true : false, product: productDetails });
    } catch (error) {
        console.error(error);
    }
}
const renderLogin = (req, res) => {
    if (req.session.user) {
        console.log(req.session.user);
    }
    res.render('user/login');
}

const handleLogin = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, password } = req.body;
        const foundUser = await User.findOne({ email, isAdmin: false }, { password: 1, isBlocked: 1 });
        console.log(foundUser);
        if (!foundUser) {
            return res.status(404).json({ error: 'Account not found. Please verify your username or sign up for a new account.' });
        }
        if (!await foundUser.comparePassword(password)) {
            return res.status(401).json({ error: 'Invalid credentials. Please check your password and try again.' });
        }
        if (foundUser.isBlocked) {
            return res.status(403).json({ error: 'Your account has been blocked by the administrator' });
        }
        req.session.user = foundUser._id;
        res.status(200).json({ redirect: '/' });
    } catch (error) {
        console.error(error);
    }
}

const renderSignup = (req, res) => {
    res.render('user/signup');
}
const handleSignup = async (req, res) => {
    try {
        req.session.tempUser = req.body;
        const { email } = req.body;
        const foundEmail = await User.findOne({ email }, { email: 1 });
        if (foundEmail) {
            console.log(foundEmail);
            return res.status(409).json({ error: 'Email address already in use.' });
        }
        req.session.tempUser.otp = generateOTP();
        // console.log('tempUser', req.session.tempUser);
        await nodemailer(req.session.tempUser.email, req.session.tempUser.otp);
        res.status(200).json({ status: 'success', redirect: '/verify-email' });
    } catch (error) {
        console.error(error);
    }
}
const renderVerifyEmail = (req, res) => {
    req.session.tempUser.createdAt = new Date();
    console.log('tempuser', req.session.tempUser);
    res.render('user/verify-email', { email: req.session.tempUser.email });
}
const handleVerifyEmail = async (req, res) => {
    try {
        if (!req.session.tempUser) {
            res.status(404).json({ error: 'session expired', redirect: '/signup' });
            // return console.log('no sesssion');
        }
        // console.log(req.body);
        const createdAt = new Date(req.session.tempUser.createdAt);
        console.log('createdAt', createdAt);
        console.log(req.session.tempUser);
        const currentTime = Date.now();
        console.log('currentTime', currentTime);
        const differenceInSeconds = (currentTime - createdAt.getTime()) / 1000;
        console.log('differenceInSeconds', differenceInSeconds);
        if (differenceInSeconds < 60) {
            if (req.session.tempUser.otp == req.body.enteredOtp) {
                const { username, email, password } = req.session.tempUser;
                const newUser = new User({ username, email, password });
                const savedUser = await newUser.save();
                console.log(savedUser);
                return res.status(200).json({ status: 'success', redirect: '/login' });
            }
            return res.status(404).json({ status: 'failed', error: 'Incorrect OTP' });
        }
        delete req.session.tempUser.otp;
        res.status(400).json({ error: 'OTP expired' });
    } catch (error) {
        console.error(error);
    }
}
const handleResendOtp = async (req, res) => {
    req.session.tempUser.otp = generateOTP();
    console.log(req.session);
    await nodemailer(req.session.tempUser.email, req.session.tempUser.otp);
    req.session.tempUser.createdAt = Date.now();
    res.status(200).json({ message: 'OTP resend success' });
}

const handleLogout = (req, res) => {
    delete req.session.user;
    delete req.session.passport;
    res.redirect('/');
}

const renderForgotPassword = (req, res) => {
    res.render('user/forgot-password');
}

module.exports = {
    renderHome,
    renderLogin,
    handleLogin,
    renderSignup,
    handleSignup,
    renderVerifyEmail,
    handleVerifyEmail,
    handleResendOtp,
    handleLogout,
    renderProductDetails,
    renderForgotPassword
}