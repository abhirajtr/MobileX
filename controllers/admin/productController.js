const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const Brand = require('../../models/brandModel');
const { ObjectId } = require('mongodb');

const renderProducts = async (req, res) => {
    try {
        // const products = await Product.find();
        const [products, categories] = await Promise.all([
            Product.find(),
            Category.find().select('name')
        ])
        res.render('admin/products', { productsActive: true, products, categories });

    } catch (error) {
        console.error(error);
    }
}
const renderAddProduct = async (req, res) => {
    try {
        // const categories = await Category.find({ isListed: true }, { _id: 0, name: 1 });
        // const brand = await Brand.find({ isBlocked: false });
        const [categories, brand] = await Promise.all([
            Category.find({ isListed: true }, { name: 1 }),
            Brand.find({ isBlocked: false }).select('name')
        ]);
        console.log('categories', categories);
        res.render('admin/add-product', { productsActive: true, categories, brand });
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
        const { name, ram, brand, category, storage, color, description, regularPrice, promotionalPrice, quantity, categoryId } = req.body;
        const newProduct = new Product({ name, brand, categoryId: category, ram, storage, color, description, regularPrice, promotionalPrice, quantity, image, categoryId });
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
        // console.log('id', req.query.id);
        // console.log('1', product);
        // const product = await Product.findById(id);
        // const categories = await Category.find({ isListed: true }, { name: 1 });
        // const brand = await Brand.find();
        const [product, categories, brand] = await Promise.all([
            Product.findById(id),
            Category.find({ isListed: true }, { name: 1 }),
            Brand.find()
        ]);
        console.log(categories);
        // console.log(categories);
        res.render('admin/edit-product', { productsActive: true, categories, brand, product });
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
        const { id, name, brand, category, ram, storage, color, description, regularPrice, promotionalPrice, quantity } = req.body;
        console.log(req.body);
        const newProduct = await Product.findByIdAndUpdate(id, { name, categoryId: category, brand, ram, storage, color, description, regularPrice, promotionalPrice, quantity });
        console.log(newProduct);
        // console.log(savedProduct);
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
    }
}
const handelEditImage = async (req, res) => {
    try {
        const file = req.file;
        console.log(req.file.filename);
        console.log(req.body);
        const newImageName = req.file.filename;
        const { productId, imageName } = req.body;
        console.log(imageName);
        // const pId = new ObjectId(productId)
        // Find the product and get the index of the image name to replace
        const product = await Product.findById(productId);
        const imageIndex = product.image.indexOf(imageName);
        if (imageIndex !== -1) {
            // Update the image array with the new image name at the found index
            await Product.findByIdAndUpdate(
                productId,
                { $set: { [`image.${imageIndex}`]: newImageName } },
                { new: true }
            );
            res.status(200).json({ status: 'success' });
        } else {
            console.log('Image name not found in the product images.');
        }
    } catch (error) {
        console.error('Internal server error');
    }
}
const renderProductDetails = async (req, res) => {
    try {
        const productDetails = await Product.findById(req.query.id);
        console.log(productDetails);
        res.render('admin/product-details', { productsActive: true, product: productDetails });
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
    handelEditImage,
}