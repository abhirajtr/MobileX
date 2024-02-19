const User = require('../models/userModel');
const renderLogin = (req, res) => {
    res.render('admin/login');
}
const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const foundAdmin = await User.findOne({ email, isAdmin: true });
        console.log(foundAdmin);
        if (!foundAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        if (! await foundAdmin.comparePassword(password)) {
            return res.status(403).json({ error: 'Inavlid Password' });
        }
        req.session.admin = foundAdmin.email;
        res.status(200).json({ redirect: '/admin/dashboard' });
    } catch (error) {
        console.error(error);
    }
}
const renderDashboard = (req, res) => {
    res.render('admin/dashboard');
}

const renderUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false });
        console.log(users);
        res.render('admin/users', { users });
    } catch (error) {
        console.error(error);
    }
}
const blockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { isBlocked: true });
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
    }
}
const unblockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { isBlocked: false });
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    renderLogin,
    handleLogin,
    renderDashboard,
    renderUsers,
    blockUser,
    unblockUser
}