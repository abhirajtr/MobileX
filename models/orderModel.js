const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    orderId: {
        type: String
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: {
            type: String
        },
        image: {
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
        }
    }],
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
})

const orderModel = mongoose.model('order', orderSchema);

module.exports = orderModel;