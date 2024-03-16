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



const changeQuantity = async (req, res) => {
    try {
        // console.log('herere--------');
        const id = req.body.productId;
        const user = req.session.user;
        const count = req.body.count;

        // console.log(user);
        // console.log(id, "productId");

        const findUser = await User.findOne({ _id: user });
        // console.log(findUser);
        const findProduct = await Product.findOne({ _id: id });

        if (findUser) {
            // console.log('iam here--');
            const productExistinCart = findUser.cart.find(item => item.productId === id);
            // console.log(productExistinCart, 'this is product in cart');
            let newQuantity
            if (productExistinCart) {
                // console.log('iam in the carrt----------------------mm');
                // console.log(count);
                if (count == 1) {
                    // console.log("count + 1");
                    newQuantity = productExistinCart.quantity + 1
                } else if (count == -1) {
                    // console.log("count - 1");
                    newQuantity = productExistinCart.quantity - 1
                } else {
                    // console.log("errrrrrrrr");
                    return res.status(400).json({ status: false, error: "Invalid count" })
                }
            } else {
                // console.log('hhihihihihihi../');
            }
            // console.log('hiiiiiiiiiiiiiiiiiiii',newQuantity);
            console.log(newQuantity, 'this id new Quantity');
            if (newQuantity > 0 && newQuantity <= findProduct.quantity) {
                let quantityUpdated = await User.updateOne(
                    { _id: user, "cart.productId": id },
                    {
                        $set: {
                            "cart.$.quantity": newQuantity
                        }
                    }
                )
                const totalAmount = findProduct.salePrice


                // console.log(totalAmount,"totsll");
                if (quantityUpdated) {
                    // console.log('iam here inside the cart', quantityUpdated, 'ok');

                    res.json({ status: true, quantityInput: newQuantity, count: count, totalAmount: totalAmount })
                } else {
                    res.json({ status: false, error: 'cart quantity is less' });

                }
            } else {
                res.json({ status: false, error: 'out of stock' });
            }
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: false, error: "Server error" });
    }
}
const renderCart = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        console.log(userId);
        const cart = await User.aggregate([
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
        // Calculate the total amount
        const totalAmount = cart.reduce((total, item) => total + item.subtotal, 0);
        // console.log(totalAmount);
        // console.log(cart);
        res.render('user/cart', { cart, totalAmount, user: req.session.user, count: req.session.count });
    } catch (error) {
        console.error(error);
    }
}

const handleUpdateQuantity = async (req, res) => {
    try {
        // console.log(req.body);
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        const newQuantity = parseInt(req.body.newQuantity);
        // const count = Number(req.body.count);
        // console.log(userId, productId, count);
        const updated = await User.findOneAndUpdate({ _id: userId, 'cart.productId': productId },
            { $set: { 'cart.$.quantity': newQuantity } });
        // Find the updated item in the cart array
        // console.log(updated);
        // const updatedItem = updated.cart.find(item => item.productId == productId);
        // console.log(updatedItem);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error(error);
    }
}

const renderCheckout = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const addresses = await Address.findOne({ userId }, { _id: 0, address: 1 });
        let cart = [];
        let totalPrice;
        console.log(req.query);
        if (req.query.product == 'single') {
            console.log('p', req.query);
            const product = await Product.findById(req.query.productId);
            console.log('product',product);
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
            // totalPrice = product.promotionalPrice;
            // req.session.cart = cart;
            // req.session.totalPrice = totalPrice;
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
        }

        console.log(cart);
        res.render('user/checkout', { user: true, cart, totalPrice, addresses });
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
    changeQuantity,
    handleUpdateQuantity,
    renderCheckout,
    handleRemoveProduct,
}