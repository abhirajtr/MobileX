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
        } else {
            const currentDate = new Date();

            // Convert the 'validFrom' and 'validUntil' strings to Date objects for comparison
            // const validFromDate = new Date(coupon.validFrom);
            // const validUntilDate = new Date(coupon.validUntil);

            // Check if the current date is within the validity period of the coupon
            if (currentDate < coupon.validFrom || currentDate > coupon.validUntil) {
                // Handle case when coupon is not valid based on date
                return res.status(400).json({ error: 'Coupon is not valid at the current date' });
            } else {
                let discountAmount = 0;

                // Calculate discount amount based on coupon discount percentage
                const discountPercentage = coupon.discountPercentage;
                const discountAmountFromPercentage = (totalAmount * discountPercentage) / 100;

                // Check if the coupon has a maximum discount amount
                if (coupon.maxDiscountAmount) {
                    // Ensure that the discount amount from percentage does not exceed the maximum discount amount
                    discountAmount = Math.min(discountAmountFromPercentage, coupon.maxDiscountAmount);
                } else {
                    discountAmount = discountAmountFromPercentage;
                }

                // Apply discount to the total price
                const finalPrice = Math.floor(totalAmount - discountAmount);

                // Now you can use 'finalPrice' for further processing
                res.status(200).json({ status: true, discountPercentage: 40, finalPrice });
            }
        }


    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handleApplyCoupon,
}