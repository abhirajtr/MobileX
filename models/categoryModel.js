const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
    },
    description: {
        type: String
    },
    isListed: {
        type: Boolean,
        default: true
    }
}, {
    versionKey: false
});

const categoryModel = mongoose.model('category', categorySchema);

module.exports = categoryModel;