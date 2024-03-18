const Coupon = require('../../models/couponModel');
const handleApplyCoupon = async (req, res) => {
    try {
        const { couponCode, totalPrice } = req.body;
        const totalAmount = req.session.totalAmount;
        const coupon = await Coupon.findOne({ couponCode: couponCode });
        console.log(coupon);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        } else if (!coupon.active) {
            return res.status(400).json({ error: 'Coupon is not active' });
        } else if (coupon.redeemedUsers.includes(req.session.user)) {
            return res.status(400).json({ error: 'Coupon has already been redeemed by the user' });
        } else {
            const currentDate = new Date();

            if (currentDate < coupon.validFrom || currentDate > coupon.validUntil) {
                return res.status(400).json({ error: 'Coupon is not valid at the current date' });
            } else {
                req.session.couponCode = coupon.couponCode;
                let discountAmount = 0;

                const discountPercentage = coupon.discountPercentage;
                const discountAmountFromPercentage = (totalAmount * discountPercentage) / 100;

                if (coupon.maxDiscountAmount) {
                    discountAmount = Math.min(discountAmountFromPercentage, coupon.maxDiscountAmount);
                } else {
                    discountAmount = discountAmountFromPercentage;
                }

                const finalPrice = Math.floor(totalAmount - discountAmount);
                console.log(finalPrice);
                req.session.finalPrice = finalPrice;

                // Add the user's ID to the redeemedUsers array
                await Coupon.findByIdAndUpdate(
                    coupon._id,
                    { $push: { redeemedUsers: req.session.user } },
                )

                res.status(200).json({ status: true, discountPercentage: discountPercentage, finalPrice });
            }
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handleApplyCoupon,
}