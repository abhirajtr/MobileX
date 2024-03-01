const Product = require('../../models/productModel');
const Category =  require('../../models/categoryModel');
const Brand =  require('../../models/brandModel');

const renderProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('admin/products', { products });

    } catch (error) {
        console.error(error);
    }
}
const renderAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true }, { name: 1 });
        const brand = await Brand.find({ isBlocked: false });
        // console.log(categories);
        res.render('admin/add-product', { products: true, categories, brand });
    } catch (error) {
        console.error(error);
    }
}
const handleAddProduct = async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.files);
        // console.log(req.files);
        const image = req.files.map(file => file.filename);
        // console.log(image);
        const { name, ram, brand, storage, color, description, regularPrice, promotionalPrice, quantity, categoryId } = req.body;
        const newProduct = new Product({ name, brand, ram, storage, color, description, regularPrice, promotionalPrice, quantity, image, categoryId });
        const savedProduct = await newProduct.save();
        console.log(savedProduct);
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
    }
}
const renderEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        console.log('id', req.query.id);
        const product = await Product.findById(id)
        console.log('1', product);
        const categories = await Category.find({ isListed: true }, { name: 1 });
        const brand = await Brand.find();
        // console.log(categories);
        res.render('admin/edit-product', { products: true, categories, brand, product });
    } catch (error) {
        console.error(error);
    }
}
const handleEditProduct = async (req, res) => {
    try {
        console.log(req.body);
        // console.log(req.files);
        // console.log(req.files);
        // const image = req.files.map(file => file.filename);
        // console.log(image);
        const { id, name, brand, ram, storage, color, description, regularPrice, promotionalPrice, quantity, categoryId } = req.body;
        console.log(req.body);
        const newProduct = await Product.findByIdAndUpdate(id, { name, brand, ram, storage, color, description, regularPrice, promotionalPrice, quantity, categoryId });
        console.log(newProduct);
        // console.log(savedProduct);
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
    }
}
const renderProductDetails = async (req, res) => {
    try {
        const productDetails = await Product.findById(req.query.id);
        console.log(productDetails);
        res.render('admin/product-details', { products: true, product: productDetails });
    } catch (error) {
        console.error(error);
    }
}
const handleBlockProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.query.id, { $set: { isBlocked: true } });
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
    }
}
const handleUnblockProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.query.id, { $set: { isBlocked: false } });
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    renderProducts,
    renderAddProduct,
    renderProductDetails,
    handleAddProduct,
    renderEditProduct,
    handleEditProduct,
    handleBlockProduct,
    handleUnblockProduct,
}