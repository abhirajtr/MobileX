const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String
    },
    brand: {
        required: true,
        type: String
    },
    category: {
        type: String
    },
    ram: {
        type: Number
    },
    storage: {
        type: Number
    },
    color: {
        type: String
    },
    description: {
        type: String
    },
    regularPrice: {
        type: Number
    },
    promotionalPrice: {
        type: Number
    },
    image: {
        type: Array
    },
    quantity: {
        type: Number
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    purchaseCount: {
        type: Number,
        default: 0
    },
    categoryId: {
        type: ObjectId,
        ref: 'category'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;