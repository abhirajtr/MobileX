const userController = require('../controllers/userController');
const { Router } = require('express');
const router = Router();
const userFound = require('../middlewares/userFound');
const isBlocked = require('../middlewares/isBlocked');

router.get('/login', userFound, userController.renderLogin);
router.post('/login', userFound, userController.handleLogin);
router.get('/signup', userFound, userController.renderSignup);
router.post('/signup', userFound, userController.handleSignup);
router.get('/verify-email', userFound, userController.renderVerifyEmail);
router.post('/verify-email', userFound, userController.handleVerifyEmail);
router.get('/resend-otp', userFound, userController.handleResendOtp);
router.get('/logout', userController.handleLogout);
router.use(isBlocked);
router.get('/', userController.renderHome);


module.exports = router;