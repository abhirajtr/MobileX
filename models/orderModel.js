const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: {
        type: Array
    },
    status: {
        type: String
    },
    totalPrice: {
        type: Number,
        // required: true
    },
    address: {
        type:Object
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'cash_on_delivery', 'razorpay'],
        default: 'cash_on_delivery'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    discount : {
        type: Number
    }
});

module.exports = mongoose.model('Order', orderSchema);