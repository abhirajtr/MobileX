const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    orderId: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String
    },
    productImage: {
        type: String
    },
    price: {
        type: Number
    },
    quantity: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered'],
        default: 'pending'
    },
    totalPrice: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String
    }
});


const orderModel = mongoose.model('order', orderSchema);

module.exports = orderModel;