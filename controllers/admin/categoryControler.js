const { ObjectId } = require("mongodb");
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');

const handleAddOffer = async (req, res) => {
    try {
        console.log(req.body);
        const { categoryName, offerPercentage } = req.body;
        const offerPercentageInt = parseInt(offerPercentage);
        console.log(offerPercentageInt);
        const products = await Product.find({ category: categoryName });
        console.log(products);
        for (const product of products) {
            // Calculate the new promotional price based on the offer percentage
            const regularPrice = product.regularPrice;
            const offerPrice = Math.round(regularPrice * (100 - offerPercentageInt) / 100);

            // Update the product's promotional price
            product.promotionalPrice = offerPrice;

            // Save the updated product
            await product.save();
        }
        await Category.findOneAndUpdate({ name: categoryName }, { $set: { offer: offerPercentageInt } });
        res.status(200).json({ status: true });

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handleAddOffer
}