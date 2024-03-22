const { default: mongoose } = require('mongoose');
const Order = require('../../models/orderModel');
const User = require('../../models/userModel');
const ObjectId = require('mongoose').Types.ObjectId

const renderOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        console.log('orders', orders);
        res.render('admin/orders', { orderActive: true ,orders });
    } catch (error) {
        console.log(error);
    }
}

const renderOrderDetails = async (req, res) => {
    try {
        console.log('details');
        console.log(req.query);
        const orderId = new ObjectId(req.query.orderId);
        // const productId = new ObjectId(req.query.productId);
        // console.log(orderId, productId);
        // const order = await Order.findOne(
        //     { _id: orderId, "products.productId": productId }, { "products.$": 1, address: 1, paymentMethod: 1, createdAt: 1 });
        const order = await Order.findOne({ _id: orderId })
        console.log('o', order);
        res.render('admin/order-details', { order, orderActive: true });
    } catch (error) {
        console.log(error);
    }
}

const handleUpdateOrderStatus = async (req, res) => {
    try {
        console.log(req.body);
        const orderId = new ObjectId(req.body.orderId);
        // const productId = new ObjectId(req.body.productId);
        const { status } = req.body;
        const result = await Order.findOneAndUpdate({ _id: orderId },
            {
                $set: { status: status }
            });
        if (result) res.status(200).json({ status: 'success', redirect: '/admin/orders' });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    renderOrders,
    renderOrderDetails,
    handleUpdateOrderStatus
}