const User = require('../../models/userModel');

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
        res.render('admin/edit-user', { users: true, user })
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
    renderUsers,
    blockUser,
    unblockUser,
    renderEditUser,
    handleEdituser,
}