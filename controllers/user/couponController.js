const Coupon = require('../../models/couponModel');
const handleApplyCoupon = async (req, res) => {
    try {
        const { couponCode, totalPrice } = req.body;
        const coupon = await Coupon.findOne({ couponCode });

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        if (!coupon.active) {
            return res.status(400).json({ error: 'Coupon is not active' });
        }

        if (coupon.redeemedUsers.includes(req.session.user)) {
            return res.status(400).json({ error: 'Coupon has already been redeemed by the user' });
        }

        const currentDate = new Date();

        if (currentDate < coupon.validFrom || currentDate > coupon.validUntil) {
            return res.status(400).json({ error: 'Coupon is not valid at the current date' });
        }

        let discountAmount = 0;
        const discountPercentage = coupon.discountPercentage;
        const discountAmountFromPercentage = (totalPrice * discountPercentage) / 100;

        if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmountFromPercentage, coupon.maxDiscountAmount);
        } else {
            discountAmount = discountAmountFromPercentage;
        }

        const finalPrice = Math.floor(totalPrice - discountAmount);

        // // Store coupon code and final price in session
        // req.session.couponCode = couponCode;
        // req.session.finalPrice = finalPrice;
        // req.session.totalPrice = finalPrice;

        // Mark the coupon as redeemed by the user
        // await Coupon.findByIdAndUpdate(coupon._id, { $push: { redeemedUsers: req.session.user } });

        res.status(200).json({ status: true, discountPercentage, finalPrice, discountAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleRemoveCoupon = async (req, res) => {
    try {
        // Get the applied coupon code from the session
        const couponCode = req.session.couponCode;

        if (!couponCode) {
            return res.status(400).json({ error: 'No coupon applied' });
        }

        // Remove coupon code and final price from session
        delete req.session.couponCode;
        delete req.session.finalPrice;

        // Remove the user from the redeemed users list in the database
        await Coupon.updateOne({ couponCode }, { $pull: { redeemedUsers: req.session.user } });

        res.status(200).json({ success: true, message: 'Coupon removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    handleApplyCoupon,
}