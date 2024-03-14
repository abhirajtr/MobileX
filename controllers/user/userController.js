const nodemailer = require('../../configs/nodemailer')
const generateOTP = require('../../configs/generateOTP');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Address = require('../../models/addressModel');
const ObjectId = require('mongoose').Types.ObjectId;
const bcrypt = require('bcrypt');
const sendMail = require('../../configs/nodemailer');

const renderHome = async (req, res) => {
    try {
        // console.log('1',req.session);
        if (req.session.passport) {
            req.session.user = req.session.passport.user._id;
        }
        const products = await Product.find({ isBlocked: false });
        // console.log(products);
        // req.session.user ? res.render('user/home', { user: req.session.user, products }) : res.render('user/home', { products });
        res.render('user/home', { home: true, products, user: req.session.user ? req.session.user : false, count: req.session.count });
        // res.render('user/order-success');
    } catch (error) {
        console.error(error);
    }
}
const renderShop = async (req, res) => {
    try {
        console.log(req.session);
        const productsCount = await Product.find({ isBlocked: false }).countDocuments();
        const products = await Product.find({ isBlocked: false });

        res.render('user/shop', { shop: true, products, productsCount, user: req.session.user ? req.session.user : false, count: req.session.count });
    } catch (error) {
        console.log(error);
    }
}
const renderSortByProducts = async (req, res) => {
    try {
        console.log('hit');
        console.log(req.body);
        const { sortBy } = req.body;
        let products;
        if (sortBy == 'price-high') {
            products = await Product.find({}).sort({ promotionalPrice: -1 });
        } else if (sortBy == 'price-low') {
            products = await Product.find({}).sort({ promotionalPrice: 1 });
        } else if (sortBy == 'latest') {
            products = await Product.find({}).sort({ _id: -1 });
        }
        // console.log(products);
        res.status(200).json({ products });
    } catch (error) {

    }
}
const renderProductDetails = async (req, res) => {
    try {
        const productId = new ObjectId(req.query.id);
        const productDetails = await Product.findById(req.query.id);
        if (req.session.user) {
            const userId = new ObjectId(req.session.user);
            const itemInCart = await User.findOne({ _id: userId, cart: { $elemMatch: { productId: productId } } });
            // console.log(cart);
            return res.render('user/product-details', { user: req.session.user ? true : false, product: productDetails, count: req.session.count, itemInCart });
        }
        // console.log(productDetails);
        res.render('user/product-details', { user: req.session.user ? true : false, product: productDetails });
    } catch (error) {
        console.error(error);
    }
}
const renderLogin = (req, res) => {
    if (req.session.user) {
        // console.log(req.session.user);
    }
    res.render('user/login');
}

const handleLogin = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, password } = req.body;
        const foundUser = await User.findOne({ email, isAdmin: false }, { password: 1, isBlocked: 1, cart: 1, wishlist: 1 });
        // console.log(foundUser);
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
        // console.log(foundUser.cart);
        req.session.count = {};
        if (foundUser.cart) {
            req.session.count.cart = foundUser.cart.length;
            // console.log("Number of items in cart:", numberOfItemsInCart);
        }
        if (foundUser.wishlist) {
            req.session.count.wishlist = foundUser.wishlist.length;
        }
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

const renderForgotPasswordEmail = (req, res) => {
    res.render('user/forgot-password-email');
}
const handleForgotPasswordEmail = async (req, res) => {
    try {
        console.log(req.body);
        const { email } = req.body;
        const foundUser = await User.findOne({ email, isAdmin: false }, { email: 1, password: 1, isBlocked: 1, cart: 1 });
        // console.log(foundUser);
        if (!foundUser) {
            return res.status(404).json({ error: 'Account not found. Please verify your email address.' });
        }
        // Initialize req.session.tempUser if it's undefined
        req.session.tempUser = req.session.tempUser || {};
        req.session.tempUser.email = foundUser.email;
        req.session.tempUser.otp = generateOTP();
        await sendMail(req.session.tempUser.email, req.session.tempUser.otp);
        console.log(req.session.tempUser);
        res.status(200).json({ redirect: '/forgot-password-otp' });
    } catch (error) {
        console.log(error);
    }
}
const forgotPasswordOtp = (req, res) => {
    req.session.tempUser.createdAt = new Date();
    res.render('user/forgot-password-otp', { email: req.session.tempUser.email });
}
const handleForgotPasswordOtp = async (req, res) => {
    try {
        if (!req.session.tempUser) return res.status(200).json({ redirect: '/login' })
        console.log(req.body);
        const createdAt = new Date(req.session.tempUser.createdAt);
        // console.log('createdAt', createdAt);
        console.log(req.session.tempUser);
        const currentTime = Date.now();
        console.log('currentTime', currentTime);
        const differenceInSeconds = (currentTime - createdAt.getTime()) / 1000;
        const { enteredOtp } = req.body;
        if (differenceInSeconds > 60) {
            return res.status(404).json({ message: 'OTP expired' })
        }
        if (req.session.tempUser.otp == enteredOtp) {
            return res.status(200).json({ status: 'success', redirect: '/forgot-password' });
        }
        res.status(404).json({ message: 'incorrect OTP' });
    } catch (error) {
        console.log(error);
    }
}

const renderForgotPassword = (req, res) => {
    res.render('user/forgot-password');
}
const handleForgotPassword = async (req, res) => {
    try {
        console.log(req.body);
        const { password } = req.body;
        const email = req.session.tempUser.email;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password with the hashed password
        await User.updateOne({ email }, { password: hashedPassword });
        res.status(200).json({ redirect: '/login' });
    } catch (error) {
        console.log(error);
    }
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
    renderForgotPasswordEmail,
    handleForgotPasswordEmail,
    forgotPasswordOtp,
    handleForgotPasswordOtp,
    renderForgotPassword,
    handleForgotPassword,
    renderShop,
    renderSortByProducts
}