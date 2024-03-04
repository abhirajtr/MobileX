const { default: mongoose } = require('mongoose');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');
const generateOrderID = require('../../configs/generateOrderId');

const handlePlaceOrder = async (req, res) => {
    try {
        const { paymentMethod, address } = req.body;
        const addressId = new mongoose.Types.ObjectId(address);
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const orderAddress = await Address.findOne({ userId: userId, "address._id": addressId }, { "address.$": 1 });
        // console.log('orderAddress', orderAddress);
        const userCart = await User.aggregate([
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
                    as: 'cartProducts'
                }
            },
            {
                $unwind: "$cartProducts"
            },
            {
                $project: {
                    _id:0,
                    userId: "$_id",
                    productId: "$cartProducts._id",
                    name: "$cartProducts.name",
                    brand: "$cartProducts.brand",
                    quantity: "$cart.quantity",
                    ram: "$cartProducts.ram",
                    storage: "$cartProducts.storage",
                    color: "$cartProducts.color",
                    image: { $arrayElemAt: ["$cartProducts.image", 0] },
                    price: "$cartProducts.promotionalPrice"
                }
            }
        ]);
        // console.log('userCart', userCart);
        const orderData = userCart.map(cartItem => ({
            productId: cartItem.productId,
            productName: cartItem.name,
            brand: cartItem.brand, // Optional: Include brand if available
            quantity: cartItem.quantity,
            ram: cartItem.ram,
            storage: cartItem.storage,
            color: cartItem.color,
            image: cartItem.image,
            price: cartItem.price,
            subtotal: cartItem.quantity * cartItem.price,
            status: "pending",
        }));
        const totalPrice = orderData.reduce((total, item) => total + item.quantity * item.price, 0);
        // console.log('orderData',orderData);
        const newOrder = new Order({
            userId: userId,
            products: orderData,
            paymentMethod: paymentMethod,
            totalPrice: totalPrice,
            address: orderAddress.address[0]
        });
        await newOrder.save();
        await User.findByIdAndUpdate(userId, { $unset: { cart: 1 } });
        res.status(200).json({ status: 'success', redirect: '/' });
    } catch (error) {
        console.log(error);
        // Abort the transaction in case of an error
        res.status(500).json({ status: 'error', message: 'Failed to place order.' });
    }
}


const handleCancelOrder = async (req, res) => {
    try {
        console.log(1);
        console.log(req.body);
        const orderId = new mongoose.Types.ObjectId(req.body.orderId);
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        // await Order.findByIdAndUpdate(orderId, { $set: { status: "cancelled" } });
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, "products.productId": productId }, // Match the order ID and the product ID
            { $set: { "products.$.status": "cancelled" } }, // Update the status of the matched product
            { new: true } // Return the updated document
        );
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handlePlaceOrder,
    handleCancelOrder,
}