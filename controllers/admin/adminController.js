const Brand = require('../../models/brandModel');
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
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
        await Category.findByIdAndUpdate(req.query.id, { $set: { isListed: false } });
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const handleListCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.query.id, { $set: { isListed: true } });
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
        if (error.code === 11000) {
            res.status(409).json({ error: `${error.keyValue.name} already exist` });
        }
        console.error(error);
    }
}
const renderBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.render('admin/brands', { brands });
    } catch (error) {
        console.error(error);
    }
}
const renderAddBrand =  (req, res) => {
    res.render('admin/brand-add');
}
const handleAddBrand = async (req, res) => {
    try {
        console.log('body',req.body);
        const newBrand = new Brand({ name : req.body.name });
        await newBrand.save();
        res.status(200).json({ redirect: '/admin/brands' });
    } catch (error) {
        console.error(error);
    }
}
const handleLogout = (req, res) => {
    delete req.session.admin;
    res.redirect('/admin/login');
}

module.exports = {
    renderLogin,
    handleLogin,
    renderDashboard,
    renderCategory,
    handleCreateCategory,
    handleListCategory,
    handleUnlistCategory,
    renderEditCategory,
    handleEditCategory,
    renderBrands,
    renderAddBrand,
    handleAddBrand,
    handleLogout,
}