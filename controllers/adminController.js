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
    res.render('admin/dashboard', { dashboard: true });
}

const renderUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false });
        // console.log(users);
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
const renderEditUser = async (req, res) => {
    try {
        const userId = req.query.id;
        // console.log(userId);
        const user = await User.findById(userId, { password: 0, isAdmin: 0, isBlocked: 0 });
        // console.log(user);
        res.render('admin/edit-user', { users: true , user})
    } catch (error) {
        console.error(error);
    }
}
const handleEdituser = async (req, res) => {
    try {
        // console.log(req.body);
        const { userId, username, email } = req.body;
        await User.findByIdAndUpdate(userId, { username, email });
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
    unblockUser,
    renderEditUser,
    handleEdituser,
}