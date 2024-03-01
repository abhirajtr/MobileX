const mongoose = require('mongoose');
const Address = require('../../models/addressModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const renderEditProfile = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user);
        const user = await User.findOne({ _id: userId });
        const addresses = await Address.findOne({ userId }, { _id: 0, address: 1 });
        console.log(addresses);
        const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
        console.log('orders', orders);
        res.render('user/edit-profile', { user, addresses, orders });
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
        res.redirect('/edit-profile');
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
        res.render('user/editAddress', { user: true, matchedAddress });
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

module.exports = {
    renderEditProfile,
    handleEditDetails,
    rednerAddNewAddress,
    handleAddNewAddress,
    renderEditAddress,
    handleEditAddress,
    handleDeleteAddress
}