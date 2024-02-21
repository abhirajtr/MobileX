const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
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
const renderProducts = async (req, res) => {
    res.render('admin/products', { products: true });
}
const renderAddProduct = (req, res) => {
    res.render('admin/add-product', { products: true });
}
const handleAddProduct = async (req, res) => {
    try {
        console.log(req.body);
        // console.log(req.files);
        const image = req.files.map(file => file.filename);
        // console.log(image);
        const { name, highlights, description, regularPrice, promotionalPrice } = req.body;
        const newProduct = new Product({ name, highlights, description, regularPrice, promotionalPrice, image });
        const savedProduct = await newProduct.save();
        console.log(savedProduct);
        res.render('admin/add-product');
    } catch (error) {
        console.error(error);
    }
}
const renderCategory = async (req, res) => {
    try {
        const category = await Category.find();
        // console.log(category);
        res.render('admin/category', { category });
    } catch (error) {
        console.error(error);
    }
}
const handleCreateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const foundCategory = await Category.findOne({ name });
        if (foundCategory) {
            return res.status(409).json({ error: 'Category name already found' });
        }
        const newCategory = new Category({ name, description });
        const savedCategory = await newCategory.save();
        console.log(savedCategory);
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const handleUnlistCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.query.id, { $set: {isListed: false} });
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const handleListCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.query.id, { $set: {isListed: true} });
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const renderEditCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.query.id);
        res.render('admin/edit-category', { category });
    } catch (error) {
        console.error(error);
    }
}
const handleEditCategory = async (req, res) => {
    try {
        console.log('edit', req.body);
        const { id, name, description } = req.body;
        const updated = await Category.findByIdAndUpdate(id, { name, description });
        res.status(200).json({ redirect: '/admin/category' });
    } catch (error) {
        if (error.code === 11000 ) {
            res.status(409).json({ error: `${error.keyValue.name} already exist` });
        }
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
    renderProducts,
    renderAddProduct,
    handleAddProduct,
    renderCategory,
    handleCreateCategory,
    handleListCategory,
    handleUnlistCategory,
    renderEditCategory,
    handleEditCategory
}