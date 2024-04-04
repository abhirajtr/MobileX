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

const renderProfile = async (req, res) => {
    try {
        let page = req.query.page;
        let orderActive = false;
        if (!page) {
            page = 1;
        } else {
            orderActive= true
        }
        const skip = page -1;
        console.log(page);
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
                    $project: {
                        "address": 0
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip:  skip*5
                },
                {
                    $limit: 5
                }
            ])

        ])
        // console.log('user', user);
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
        // console.log('Orders', userOrders);
        res.render('user/profile', { user, addresses, orders: userOrders, count: req.session.count, orderActive });
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
    const paymentInfo = req.body.response;
    const signatureString = `${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', 'gJQKhh0UcUekJlYa3oqdKttw')
        .update(signatureString)
        .digest('hex');
    // Compare the recalculated signature with the signature received from Razorpay
    if (expectedSignature === paymentInfo.razorpay_signature) {
        const addAmount = parseInt(req.body.addAmount);
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
                        balance: updatedBalance,
                        description: "Added funds manually by user",
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

const renderOrderDeatils = async (req, res) => {
    try {
        const orderId = new ObjectId(req.query.id);
        const order = await Order.findById(orderId);
        // console.log('o', order);
        res.render('user/order-details', { user: true, order, count: req.session.count });
    } catch (error) {
        console.error(error);
    }
}

const redeemReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.body;
        // const foundReferralCode = await User.findOne({ referralCode: referralCode }, { referralCode: 1, _id: 0 });
        const [foundReferralCode, user] = await Promise.all([
            User.findOne({ referralCode: referralCode }, { referralCode: 1, _id: 0 }),
            User.findOne({ _id: req.session.user }, { _id: 0, walletBalance: 1, redeemed: 1 })
        ])
        if (user.redeemed) {
            return res.status(400).json({ error: 'Referral code has already been redeemed.' });
        }
        if (foundReferralCode) {
            await User.updateOne(
                { _id: req.session.user },
                {
                    $set: { redeemed: true },
                    $inc: { walletBalance: 100 },
                    $push: {
                        walletHistory: {
                            type: "credit",
                            amount: 100,
                            balance: user.walletBalance + 100,
                            date: Date.now()
                        }
                    }
                }
            );

            return res.status(200).json({ status: true, message: 'Referral code successfully redeemed. ₹100 added to your wallet balance.' });
        }
        res.status(400).json({ error: 'Invalid referral code. Please provide a valid referral code and try again.' });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    renderProfile,
    handleEditDetails,
    rednerAddNewAddress,
    handleAddNewAddress,
    renderEditAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleAddWalletBalance,
    verifyWalletPayment,
    renderOrderDeatils,
    redeemReferralCode
}