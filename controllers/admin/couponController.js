const { render } = require('ejs');
const Coupon = require('../../models/couponModel');
const renderCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/coupon', { couponActive: true, coupons });
    } catch (error) {
        console.error(error);
    }
}
const handleAddCoupen = async (req, res) => {
    try {
        console.log(req.body);
        const { couponCode, discountPercentage, validFrom, validUntil, active, maxDiscountAmount } = req.body;
        // const status = statusString === "true";
        // console.log(status);
        const newCoupon = new Coupon({
            couponCode,
            discountPercentage,
            validFrom,
            validUntil,
            active,
            maxDiscountAmount
        });
        await newCoupon.save();
        res.status(200).json({ status: true, newCoupon });
    } catch (error) {
        if (error.code == 11000) {
            res.status(409).json({ status: false, message: 'Coupon already found' });
        }
        console.error(error);
    }
}
const renderEditCoupon = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        const coupon = await Coupon.findById(couponId);
        res.render('admin/coupon-edit', { couponActive: true, coupon });
    } catch (error) {
        console.error(error);
    }
}
const handleEditCoupon = async (req, res) => {
    try {
        console.log(req.body);
        const { couponCode, discountPercentage, validFrom, validUntil, active, couponId, maxDiscountAmount } = req.body;
        await Coupon.findByIdAndUpdate(couponId,{$set: { couponCode, discountPercentage, validFrom, validUntil, active, couponId, maxDiscountAmount } });
        res.status(200).json({ status:true, redirect: '/admin/coupon' });
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    renderCoupon,
    handleAddCoupen,
    renderEditCoupon,
    handleEditCoupon
}