const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String
    },
    highlights: {
        type: Array
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
    }
}, {
    versionKey: false
});

const productModel = mongoose.model('product', productSchema);

module.exports = productModel;