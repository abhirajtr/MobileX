const mongoose = require('mongoose');

// Define the schema for the coupon
const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  maxDiscountAmount: {
    type: Number,
    min: 100
  },
  validFrom: {
    type: String,
    required: true
  },
  validUntil: {
    type: String,
    required: true
  },
  maxUses: {
    type: Number,
    default: 1,
    min: 1
  },
  currentUses: {
    type: Number,
    default: 0,
    min: 0
  },
  active: {
    type: Boolean,
    // default: true
  },
  redeemedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Compile the schema into a model
const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
