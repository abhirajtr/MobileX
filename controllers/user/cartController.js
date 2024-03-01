const { default: mongoose } = require('mongoose');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const mongodb = require("mongodb")

// const renderCart = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         const user = await User.findById(userId, { cart: 1 });
//         // console.log(user);
//         const productIds = user.cart.map(item => item.productId);
//         // console.log(productIds);
//         const products = await Product.find({ _id: { $in: productIds } });
//         console.log('products', products);
//         const oid = new mongodb.ObjectId(userId);
//         let data = await User.aggregate([
//             { $match: { _id: oid } },
//             { $unwind: '$cart' },
//             {
//                 $project: {
//                     proId: { '$toObjectId': '$cart.productId' },
//                     quantity: '$cart.quantity',
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'products',
//                     localField: 'proId',
//                     foreignField: '_id',
//                     as: 'productDetails',
//                 }
//             },
//         ]);
//         console.log('data', data);
//         // console.log("Data  =>>", data[0].productDetails[0])
//         let quantity = 0;

//         for (const i of user.cart) {
//             quantity += i.quantity
//         }
//         let grandTotal = 0;
//         for (let i = 0; i < data.length; i++) {

//             if (products[i]) {
//                 grandTotal += data[i].productDetails[0].promotionalPrice * data[i].quantity;
//             }
//             req.session.grandTotal = grandTotal
//         }
//         res.render('user/cart', {
//             user: req.session.user, quantity,
//             data,
//             grandTotal
//         });
//     } catch (error) {
//         console.error(error);
//     }
// }

const handleAddToCart = async (req, res) => {
    try {
        console.log(req.body);
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        // console.log(productId);
        // const product = await Product.findById(productId, {} );
        // console.log(product);
        const updatedCart = await User.updateOne(
            { _id: req.session.user, "cart.productId": { $ne: productId } },
            { $addToSet: { cart: { productId, quantity: 1 } } }
        );
        console.log(updatedCart.modifiedCount);
        if (updatedCart.modifiedCount) {
            res.status(200).json({ status: 'success' });
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
                console.log(count);
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


const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id, "id");
        const userId = req.session.user
        const user = await User.findById(userId)
        const cartIndex = user.cart.findIndex(item => item.productId == id)
        user.cart.splice(cartIndex, 1)
        await user.save()
        console.log("item deleted from cart");
        res.redirect("/cart")
    } catch (error) {
        console.log('thsi is aeroor ', error);
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
        console.log(totalAmount);
        console.log(cart);
        res.render('user/cart', { cart, totalAmount, user: req.session.user });
    } catch (error) {
        console.error(error);
    }
}

const handleUpdateQuantity = async (req, res) => {
    try {
        console.log(req.body);
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
        const totalPrice = cart.reduce((total, item) => total + item.subtotal, 0);
        console.log(cart);
        res.render('user/checkout', { user: true, cart, totalPrice });
    } catch (error) {
        console.error(error);
    }
}

const handlePlaceOrder = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        console.log(req.body);
        const userId = new mongoose.Types.ObjectId(req.session.user);
        // console.log(req.body);
        console.log(paymentMethod);
        const userCart = await User.aggregate([{ $match: { _id: userId }, },
        { $unwind: "$cart" },
        {
            $lookup: {
                from: "products",
                localField: "cart.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                _id: 0,
                userId: "$_id",
                productId: "$product._id",
                productName: "$product.name",
                productImage: { $arrayElemAt: ["$product.image", 0] },
                productPrice: "$product.promotionalPrice",
                quantity: "$cart.quantity"
            }
        }
        ]);
        console.log(userCart);
        // Calculate the total price based on user's cart data
        const totalPrice = userCart.reduce((total, item) => total + item.productPrice * item.quantity, 0);
        console.log(totalPrice);
        // Construct the products array for the new order
        const products = userCart.map(item => ({
            name: item.productName,
            product: item.productId,
            image: item.productImage,
            price: item.productPrice,
            quantity: item.quantity,
            status: 'pending' // Set the initial status of each product
        }));

        function generateOrderId() {
            const timestamp = Date.now().toString(); // Get current timestamp
            const randomString = Math.random().toString(36).substring(2, 8); // Generate random string
            return timestamp + '-' + randomString; // Concatenate timestamp and random string
        }

        // Create a new Order object
        const newOrder = new Order({
            orderId: generateOrderId(),
            customer: userId,
            products: products,
            totalPrice: totalPrice,
            paymentMethod: paymentMethod
        });
        await newOrder.save();
        res.status(200).json({ status: 'success', redirect: '/orders' });
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    renderCart,
    handleAddToCart,
    changeQuantity,
    deleteProduct,
    handleUpdateQuantity,
    renderCheckout,
    handlePlaceOrder,
}