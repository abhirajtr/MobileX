const { default: mongoose } = require('mongoose');
const Order = require('../../models/orderModel');
const User = require('../../models/userModel');

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
        const orderId = new mongoose.Types.ObjectId(req.query.id);
        const orderDetails = await Order.aggregate([
            {
                $match: {
                    _id: orderId
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                },
            },
            {
                $unwind: "$user"
            },
            {
                $lookup: {
                    from: 'address',
                    localField: 'address',
                    foreignField: '_id',
                    as: 'orderAddress'
                }
            }
        ]);
        console.log(orderDetails);
        res.render('admin/order-details');
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    renderOrders,
    renderOrderDetails
}