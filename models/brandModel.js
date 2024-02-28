const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    image: {
        type: String
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false
});

const brandModel = mongoose.model('brand', brandSchema);

module.exports = brandModel;