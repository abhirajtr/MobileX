const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    cart: [{
        productId: {
            type: mongoose.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number
    }],
    wishlist: [{
        productId: {
            type: mongoose.Types.ObjectId,
            ref: 'Product'
        }
    }],
    walletBalance: {
        type: Number,
        default: 0
    },
    walletHistory: {
        type: Array
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    }, 
    referralCode: {
        type: String
    },
    redeemed: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false
});

userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        try {
            const hashedPassword = await bcrypt.hash(this.password, 10);
            this.password = hashedPassword;
        } catch (error) {
            console.error(error);
        }
    }
});

userSchema.methods.comparePassword = async function (password) {
    const comparePassword = await bcrypt.compare(password, this.password);
    console.log('comparePassword', comparePassword);
    return comparePassword;
}

const User = mongoose.model('User', userSchema);

module.exports = User;