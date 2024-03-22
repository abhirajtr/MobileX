const { default: mongoose } = require('mongoose');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');
const mongodb = require("mongodb")

const handleAddToCart = async (req, res) => {
    try {
        if (!req.session.user) {
            res.status(404).json({ redirect: '/login' });
        }
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        const updatedCart = await User.updateOne(
            { _id: req.session.user, "cart.productId": { $ne: productId } },
            { $addToSet: { cart: { productId, quantity: 1 } } }
        );
        // console.log(updatedCart.modifiedCount);
        if (updatedCart.modifiedCount) {
            req.session.count.cart++;
            res.status(200).json({ status: 'success' });
            console.log(req.session);
        }
    } catch (error) {
        console.error(error);
    }
}

const renderCart = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const cart = await User.aggregate([
            {
                $match: {
                    _id: userId
                }
            },
            {
                $unwind: "$cart"
            },
            {
                $lookup: {
                    from: "products", 
                    localField: "cart.productId", 
                    foreignField: "_id", 
                    as: "cartItems" 
                }
            },
            {
                $unwind: "$cartItems"
            },
            {
                $project: {
                    _id: 0,
                    productId: "$cartItems._id",
                    productName: "$cartItems.name",
                    productPrice: "$cartItems.promotionalPrice",
                    quantity: "$cart.quantity",
                    image: "$cartItems.image",
                    subtotal: { $multiply: ["$cartItems.promotionalPrice", "$cart.quantity"] }
                }
            }
        ]);
        const totalAmount = cart.reduce((total, item) => total + item.subtotal, 0);
        req.session.totalPrice = totalAmount;
        res.render('user/cart', { cart, totalAmount: req.session.totalPrice, user: req.session.user, count: req.session.count });
    } catch (error) {
        console.error(error);
    }
}

const handleUpdateQuantity = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        const newQuantity = parseInt(req.body.newQuantity);
        const product = await Product.findOne({ _id: productId });
        if (product.quantity < newQuantity) {
            return res.status(400).json({ status: 'error', message: 'Insufficient product quantity', newQuantity: newQuantity-1 });
        }
        const updated = await User.findOneAndUpdate({ _id: userId, 'cart.productId': productId },
            { $set: { 'cart.$.quantity': newQuantity } });

        const totalAmount = await User.aggregate([
            {
                $match: { "_id": userId } // Match the user document
            },
            {
                $unwind: "$cart" // Deconstruct the cart array
            },
            {
                $lookup: {
                    from: "products", // Assuming the name of the products collection is "products"
                    localField: "cart.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product" // Deconstruct the product array
            },
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: { $multiply: ["$cart.quantity", "$product.promotionalPrice"] } } // Calculate the total price
                }
            },
            {
                $project: { _id: 0, totalPrice: 1 } // Project only the totalPrice field
            }
        ]);
        req.session.totalPrice = totalAmount[0].totalPrice;
        console.log(req.session);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error(error);
    }
}

const renderCheckout = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const addresses = await Address.findOne({ userId }, { _id: 0, address: 1 });
        let walletBalance = await User.findById(userId, { walletBalance: 1 });
        walletBalance = walletBalance.walletBalance;
        let cart = [];
        let totalPrice;
        // buyNow
        if (req.query.product == 'single') {
            const product = await Product.findById(req.query.productId);
            cart.push({
                productId: product._id,
                productName: product.name,
                brand: product.brand,
                ram: product.ram,
                storage: product.storage,
                color: product.color,
                productPrice: product.promotionalPrice,
                quantity: 1,
                image: product.image,
                subtotal: product.promotionalPrice
            });
            totalPrice = product.promotionalPrice;
            req.session.totalAmount = totalPrice;
            req.session.productId = req.query.productId;
        } else {
            cart = await User.aggregate([
                {
                    $match: {
                        _id: userId // Match the specific user by their _id
                    }
                },
                {
                    $unwind: "$cart"
                },
                {
                    $lookup: {
                        from: "products", // The collection to join with
                        localField: "cart.productId", // Field from the users collection
                        foreignField: "_id", // Field from the products collection
                        as: "cartItems" // Output array field
                    }
                },
                {
                    $unwind: "$cartItems"
                },
                {
                    $project: {
                        _id: 0,
                        productId: "$cartItems._id",
                        productName: "$cartItems.name",
                        productPrice: "$cartItems.promotionalPrice",
                        quantity: "$cart.quantity",
                        image: "$cartItems.image",
                        subtotal: { $multiply: ["$cartItems.promotionalPrice", "$cart.quantity"] }
                    }
                }
            ]);
            totalPrice = cart.reduce((total, item) => total + item.subtotal, 0);
            req.totalPrice = totalPrice;
        }

        console.log(cart);
        res.render('user/checkout', { user: true, cart, totalPrice, addresses, walletBalance,  count: req.session.count});
    } catch (error) {
        console.error(error);
    }
}

const handleRemoveProduct = async (req, res) => {
    try {
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const result = await User.updateOne({ _id: userId }, { $pull: { cart: { productId } } });
        // console.log(result);
        req.session.count.cart--;
        res.status(200).json({ status: 'success' })

    } catch (error) {
        console.log(error);
    }
}





module.exports = {
    renderCart,
    handleAddToCart,
    handleUpdateQuantity,
    renderCheckout,
    handleRemoveProduct,
}