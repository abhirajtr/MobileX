const { default: mongoose } = require('mongoose');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');

const handlePlaceOrder = async (req, res) => {
    try {
        const { paymentMethod, address } = req.body;
        console.log(req.body);
        const addressId = new mongoose.Types.ObjectId(address)
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
        // console.log(userCart);
        // // Calculate the total price based on user's cart data
        // const totalPrice = userCart.reduce((total, item) => total + item.productPrice * item.quantity, 0);
        // console.log(totalPrice);
        // // Construct the products array for the new order
        // const products = userCart.map(item => ({
        //     name: item.productName,
        //     product: item.productId,
        //     image: item.productImage,
        //     price: item.productPrice,
        //     quantity: item.quantity,
        //     status: 'pending' // Set the initial status of each product
        // }));

        // function generateOrderId() {
        //     const timestamp = Date.now().toString(); // Get current timestamp
        //     const randomString = Math.random().toString(36).substring(2, 8); // Generate random string
        //     return timestamp + '-' + randomString; // Concatenate timestamp and random string
        // }

        // // Create a new Order object
        // const newOrder = new Order({
        //     orderId: generateOrderId(),
        //     customer: userId,
        //     address: addressId,
        //     products: products,
        //     totalPrice: totalPrice,
        //     paymentMethod: paymentMethod
        // });
        // await newOrder.save();
        // res.status(200).json({ status: 'success', redirect: '/orders' });
        // await User.findOneAndUpdate({ _id: userId }, { $unset: { cart: 1 } });

        const orders = [];
        for (const item of userCart) {
            const newOrder = new Order({
                userId: userId,
                address: addressId,
                product: item.productId,
                productName: item.productName,
                productImage: item.productImage,
                price: item.productPrice,
                quantity: item.quantity,
                totalPrice: item.productPrice * item.quantity,
                paymentMethod: paymentMethod
            })
            await newOrder.save();
        }
        await User.findByIdAndUpdate(userId, { $unset: { cart: 1 } });
        res.status(200).json({ status: 'success', redirect: '/' });
    } catch (error) {
        console.log(error);
    }
}

const handleCancelOrder = async (req, res) => {
    try {
        console.log(req.body);
        const orderId = new mongoose.Types.ObjectId(req.body.orderId);
        await Order.findByIdAndUpdate(orderId, { $set: { status: "cancelled" } });
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handlePlaceOrder,
    handleCancelOrder,
}