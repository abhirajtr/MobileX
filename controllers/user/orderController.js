const { default: mongoose } = require('mongoose');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');
const generateOrderID = require('../../configs/generateOrderId');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

var instance = new Razorpay({
    key_id: 'rzp_test_2hyTCJ2qBkwleR',
    key_secret: 'gJQKhh0UcUekJlYa3oqdKttw',
});

const handlePlaceOrder = async (req, res) => {
    try {
        const { paymentMethod, address } = req.body;
        console.log(req.body);
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
                    _id: 0,
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
        if (paymentMethod == 'razorpay') {
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
                status: "Awaiting_Payment",
            }));
            const totalPrice = orderData.reduce((total, item) => total + item.quantity * item.price, 0);
            const newOrder = new Order({
                userId: userId,
                products: orderData,
                paymentMethod: paymentMethod,
                totalPrice: totalPrice,
                address: orderAddress.address[0]
            });
            await newOrder.save();
            const savedOrder = await newOrder.save();
            req.session.orderId = savedOrder._id;
            await User.findByIdAndUpdate(userId, { $unset: { cart: 1 } });
            // // Update product quantities based on the order
            for (const item of orderData) {
                await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity } });
            }
            const amount = String(totalPrice * 100);
            console.log('amount', amount);
            var options = {
                amount: amount,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "order_rcptid_11"
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                if (!err) {
                    res.status(200).json({ paymentMethod: 'razorpay', orderId: order.id });
                }
            });
        } else {
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
                status: "processing",
            }));
            const totalPrice = orderData.reduce((total, item) => total + item.quantity * item.price, 0);
            const newOrder = new Order({
                userId: userId,
                products: orderData,
                paymentMethod: paymentMethod,
                totalPrice: totalPrice,
                address: orderAddress.address[0]
            });
            // await newOrder.save();
            // await User.findByIdAndUpdate(userId, { $set: { cart: [] } });
            // // // Update product quantities based on the order
            // for (const item of orderData) {
            //     await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity } });
            // }
            await Promise.all([
                newOrder.save(),
                User.findByIdAndUpdate(userId, { $set: { cart: [] } }),
                ...orderData.map(async (item) => {
                    await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity } });
                })
            ])
            res.status(200).json({ status: 'success', redirect: '/order-success' });
        }
    } catch (error) {
        console.log(error);
        // Abort the transaction in case of an error
        res.status(500).json({ status: 'error', message: 'Failed to place order.' });
    }
}
const verifypayment = async (req, res) => {
    console.log(req.body);
    const paymentInfo = req.body.response;
    console.log('payment info', paymentInfo);
    // Construct the string to be signed
    const signatureString = `${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`;
    // Recalculate the signature using your Razorpay secret
    const expectedSignature = crypto.createHmac('sha256', 'gJQKhh0UcUekJlYa3oqdKttw')
        .update(signatureString)
        .digest('hex');
    // Compare the recalculated signature with the signature received from Razorpay
    if (expectedSignature === paymentInfo.razorpay_signature) {
        // Payment verified
        console.log('Payment verified');
        // return res.status(200).json({ redirect: '/order-success'});
        const orderId = new ObjectId(req.session.orderId);
        console.log(orderId);
        await Order.findByIdAndUpdate(
            orderId, // Replace with the actual order ID
            { $set: { 'products.$[].status': 'Payment Done' } }
        );

        res.status(200).json({ redirect: '/order-success', user: req.session.user });
    } else {
        // Payment verification failed
        console.error('Payment verification failed');
        return false;
    }
}

const handleCancelOrder = async (req, res) => {
    try {
        console.log(1);
        console.log(req.body);
        const orderId = new mongoose.Types.ObjectId(req.body.orderId);
        const productId = new mongoose.Types.ObjectId(req.body.productId);
        // await Order.findByIdAndUpdate(orderId, { $set: { status: "cancelled" } });
        // const updatedOrder = await Order.findOneAndUpdate(
        //     { _id: orderId, "products.productId": productId }, // Match the order ID and the product ID
        //     { $set: { "products.$.status": "cancelled" } }, // Update the status of the matched product
        //     { new: true } // Return the updated document
        // );
        const updatedOrder = await Order.findOneAndUpdate({ _id: orderId, "products.productId": productId }, {
            $set: { "products.$.status": "cancelled" }
        });
        console.log(updatedOrder);
        await Product.findOneAndUpdate({ _id: productId }, { $inc: { quantity: updatedOrder.products[0].quantity } });
        // await Product.findByIdAndUpdate(productId, {$inc: { quantity: } })
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error(error);
    }
}
const renderOrderSuccess = (req, res) => {
    res.render('user/order-success', { user: req.session.user });
}

module.exports = {
    handlePlaceOrder,
    handleCancelOrder,
    verifypayment,
    renderOrderSuccess
}