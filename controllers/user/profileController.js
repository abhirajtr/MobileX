const Address = require('../../models/addressModel');

const rednerAddNewAddress = (req, res) => {
    res.render('user/addNewAddress', { user: req.session.user ? true : false });
}
const handleAddNewAddress = async (req, res) => {
    // console.log('success');
    // res.json(req.body);
    // console.log(req.body);
    try {
        const { addressType, name, landMark, state, pincode, phone, altPhone } = req.body;
        const foundAddress = await Address.findOne({ userId: req.session.user }, { _id: 1 });
        console.log(foundAddress);
        if (foundAddress) {
            const updated = await Address.findByIdAndUpdate(foundAddress._id, {
                $addToSet: { address: { addressType, name, landMark, state, pincode, phone, altPhone } }
            },
                { new: true });
            console.log(updated);
        } else {
            const newAddress = new Address({ userId: req.session.user, address: [{ addressType, name, landmark, state, pincode, phone, altPhone }] });
            await newAddress.save();
        }
    } catch (error) {
        console.error(error);
    }
}

const renderEditAddress = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    rednerAddNewAddress,
    handleAddNewAddress
}