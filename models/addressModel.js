const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: [{
        addressType: {
            type: String
        },
        name: {
            type: String
        },
        city: {
            type: String
        },
        landmark: {
            type: String
        },
        state: {
            type: String
        },
        pincode: {
            type: Number
        },
        phone: {
            type: Number
        },
        altPhone: {
            type: Number
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }]
}, {
    versionKey: false
})

const addressModel = mongoose.model('address', addressSchema);

module.exports = addressModel;