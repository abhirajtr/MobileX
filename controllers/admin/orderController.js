const { default: mongoose } = require('mongoose');
const Order = require('../../models/orderModel');
const User = require('../../models/userModel');
const ObjectId = require('mongoose').Types.ObjectId

const renderOrders = async (req, res) => {
    try {
        const orders = await Order.aggregate([
            {
                $unwind: "$products"
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    "products.productId": 1,
                    "products.subtotal": 1,
                    "products.status": 1,
                    "createdAt": 1,
                    "user.username": 1,
                    "user.email": 1
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);
        console.log('orders', orders);
        // const orders = await Order.find({}, {address:0}).populate({
        //     path: "userId",
        //     select: '_id username email'
        // });
        // const orders = await Order.find()
        // console.log(orders);

        res.render('admin/orders', { orders });
    } catch (error) {
        console.log(error);
    }
}

const renderOrderDetails = async (req, res) => {
    try {
        console.log('details');
        const orderId = req.query.orderId;
        const productId = new ObjectId(req.query.productId);
        console.log(orderId, productId);
        const order = await Order.findOne(
            { _id: orderId, "products.productId": productId }, { "products.$": 1, address: 1, paymentMethod: 1, createdAt: 1 });

        console.log('o', order);
        res.render('admin/order-details', { order });
    } catch (error) {
        console.log(error);
    }
}

const handleUpdateOrderStatus = async (req, res) => {
    try {
        console.log(req.body);
        const orderId = new ObjectId(req.body.orderId);
        const productId = new ObjectId(req.body.productId);
        const { status } = req.body;
        await Order.findOneAndUpdate({ _id: orderId, "products.productId": productId }, {
            $set: { "products.$.status": status }
        });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    renderOrders,
    renderOrderDetails,
    handleUpdateOrderStatus
}