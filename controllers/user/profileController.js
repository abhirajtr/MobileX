const mongoose = require('mongoose');
const Address = require('../../models/addressModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const crypto = require('crypto');

var instance = new Razorpay({
    key_id: 'rzp_test_2hyTCJ2qBkwleR',
    key_secret: 'gJQKhh0UcUekJlYa3oqdKttw',
});

const renderEditProfile = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        // const user = await User.findOne({ _id: userId });
        // const addresses = await Address.findOne({ userId }, { _id: 0, address: 1 });
        const [user, addresses, userOrders] = await Promise.all([
            User.findOne({ _id: userId }),
            Address.findOne({ userId }, { _id: 0, address: 1 }),
            Order.aggregate([
                {
                    $match: {
                        userId: userId
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        "address": 0
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ])
        ])
        console.log('user', user);
        // console.log(addresses);
        // const userOrders = await Order.find({ userId }, { address: 0, userId: 0, });
        // const userOrders = await Order.aggregate([
        //     {
        //         $match: {
        //             userId: userId
        //         }
        //     },
        //     {
        //         $unwind: "$products"
        //     },
        //     {
        //         $project: {
        //             "address": 0
        //         }
        //     },
        //     {
        //         $sort: {
        //             createdAt: -1
        //         }
        //     }
        // ])
        console.log('Orders', userOrders);
        res.render('user/profile', { user, addresses, orders: userOrders, count: req.session.count });
    } catch (error) {
        console.error(error);
    }
}
const handleEditDetails = async (req, res) => {
    try {
        console.log(req.body);
        const { name: username, email } = req.body;
        await User.findOneAndUpdate({ email: req.session.user }, { $set: { username: username, email: email } });
        res.status(200).json({ message: 'Details updated successfully' });
    } catch (error) {
        console.error(error);
    }
}

const rednerAddNewAddress = (req, res) => {
    res.render('user/addNewAddress', { user: req.session.user ? true : false });
}
const handleAddNewAddress = async (req, res) => {
    // console.log('success');
    // res.json(req.body);
    // console.log(req.body);
    try {
        const { addressType, name, city, landmark, state, pincode, phone, altPhone } = req.body;
        const foundAddress = await Address.findOne({ userId: req.session.user }, { _id: 1 });
        console.log(foundAddress);
        if (foundAddress) {
            const updated = await Address.findByIdAndUpdate(foundAddress._id, {
                $addToSet: { address: { addressType, name, city, landmark, state, pincode, phone, altPhone } }
            },
                { new: true });
            console.log(updated);
        } else {
            const newAddress = new Address({ userId: req.session.user, address: [{ addressType, name, city, landmark, state, pincode, phone, altPhone }] });
            await newAddress.save();

        }
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
    }
}

const renderEditAddress = async (req, res) => {
    try {
        console.log('edit address');
        const addressId = req.query.id;
        const userId = new mongoose.Types.ObjectId(req.session.user);
        console.log(userId);
        const currentAddress = await Address.findOne({ userId, 'address._id': addressId });
        const matchedAddress = currentAddress.address.find(addr => addr._id.toString() === addressId);
        console.log(matchedAddress);
        res.render('user/editAddress', { user: true, matchedAddress, count: req.session.count });
    } catch (error) {
        console.error(error);
    }
}
const handleEditAddress = async (req, res) => {
    try {
        console.log('update address');
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const { addressId, addressType, name, city, landmark, state, pincode, phone, altPhone } = req.body;
        const updatedAddress = await Address.findOneAndUpdate(
            {
                userId: userId,
                'address._id': addressId // Match the address ID within the address array
            },
            {
                $set: { // Update the fields as needed
                    'address.$.addressType': addressType,
                    'address.$.name': name,
                    'address.$.city': city,
                    'address.$.landmark': landmark,
                    'address.$.state': state,
                    'address.$.pincode': pincode,
                    'address.$.phone': phone,
                    'address.$.altPhone': altPhone
                }
            },
            {
                new: true // Return the updated document
            }
        );
        console.log(updatedAddress);
        res.redirect('/edit-profile');
    } catch (error) {
        console.error(error);
    }
}

const handleDeleteAddress = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const addressId = req.query.id;
        await Address.findOneAndUpdate({
            userId
        }, {
            $pull: {
                address: { _id: addressId }
            }
        });
        res.redirect('/edit-profile');
    } catch (error) {
        console.error(error);
    }
}

const handleAddWalletBalance = async (req, res) => {
    try {
        console.log('wall', req.body);
        const userId = new ObjectId(req.session.user);
        const { amount } = req.body;
        var options = {
            amount: amount * 100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: "order_rcptid_11"
        };
        instance.orders.create(options, function (err, order) {
            console.log(order);
            if (!err) {
                // const amount = order.amount.toString();
                return res.status(200).json({ orderId: order.id, amount: order.amount });
            }
        });
        // const updatedBalance = await User.findByIdAndUpdate(userId, { $inc: {walletBalance: amount } });
        // res.status(200).json({ status : true, walletBalance: updatedBalance.walletBalance });
    } catch (error) {
        console.error(error);
    }
}

const verifyWalletPayment = async (req, res) => {
    console.log(req.body);
    const paymentInfo = req.body.response;
    const orderId = new ObjectId(req.session.orderId);
    delete req.session.orderId;
    const { orderData } = req.session;
    delete req.session.orderData;
    // console.log('payment info', paymentInfo);
    // Construct the string to be signed
    const signatureString = `${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`;
    // Recalculate the signature using your Razorpay secret
    const expectedSignature = crypto.createHmac('sha256', 'gJQKhh0UcUekJlYa3oqdKttw')
        .update(signatureString)
        .digest('hex');
    // Compare the recalculated signature with the signature received from Razorpay
    if (expectedSignature === paymentInfo.razorpay_signature) {
        // console.log('Payment verified');
        // await Order.findByIdAndUpdate(
        //     orderId, // Replace with the actual order ID
        //     { $set: { 'products.$[].status': 'Payment Done' } }
        // );

        // console.log('o', orderData);
        // await Promise.all(orderData.map(async (item) => {
        //     await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity, purchaseCount: item.quantity } });
        // }));

        // res.status(200).json({ redirect: '/order-success', user: req.session.user });
        // const updatedBalance = await User.findByIdAndUpdate(req.session.user, { $inc: {walletBalance: parseInt(req.body.addAmount) } });
        const addAmount = parseInt(req.body.addAmount);

        // Assuming you have the current wallet balance stored in a variable named currentBalance
        const Balance = await User.findById(req.session.user, { _id: 0, walletBalance: 1 });
        const currentBalance = Balance.walletBalance;
        const updatedBalance = currentBalance + addAmount;
        const updatedUser = await User.findByIdAndUpdate(
            req.session.user,
            {
                $inc: { walletBalance: addAmount }, // Increment the wallet balance
                $push: {
                    walletHistory: { // Push a new transaction object to the wallet history array
                        type: "credit", // Type of transaction (e.g., credit)
                        amount: addAmount, // Amount credited
                        balance: updatedBalance, // Updated wallet balance after the credit
                        date: Date.now()
                    }
                }
            },
            { new: true } // Return the updated document after the update is applied
        );
        res.status(200).json({ status: true, walletBalance: updatedUser.walletBalance });
    } else {
        // Payment verification failed
        console.error('Payment verification failed');
        return false;
    }
}

module.exports = {
    renderEditProfile,
    handleEditDetails,
    rednerAddNewAddress,
    handleAddNewAddress,
    renderEditAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleAddWalletBalance,
    verifyWalletPayment
}