const userController = require('../controllers/userController');
const { Router } = require('express');
const router = Router();

router.get('/', userController.renderHome);
router.get('/login', userController.renderLogin);
router.get('/signup', userController.renderSignup);
router.post('/signup', userController.handleSignup);

module.exports = router;