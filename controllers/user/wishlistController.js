const { ObjectId } = require('mongodb');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');

const renderWishlist = async (req, res) => {
    try {

        const userId = new ObjectId(req.session.user);
        // console.log(userId);
        const wishlist = await User.aggregate([
            {
                $match: {
                    _id: userId // Match the specific user by their _id
                }
            },
            {
                $unwind: "$wishlist"
            },
            {
                $lookup: {
                    from: "products", // The collection to join with
                    localField: "wishlist.productId", // Field from the users collection
                    foreignField: "_id", // Field from the products collection
                    as: "wishlist" // Output array field
                }
            },
            {
                $unwind: "$wishlist"
            },
            {
                $project: {
                    _id: 0,
                    productId: "$wishlist._id",
                    productName: "$wishlist.name",
                    productPrice: "$wishlist.promotionalPrice",
                    image: "$wishlist.image",
                    quantity: "$wishlist.quantity"
                }
            }
        ]);
        // console.log(wishlist);

        res.render('user/wishlist', { wishlist, user: req.session.user, count: req.session.count });
    } catch (error) {
        console.log(error);
    }
}

const handleAddToWishlist = async (req, res) => {
    try {
        // console.log(req.body);
        const productId = new ObjectId(req.body.productId);
        await User.findByIdAndUpdate(
            req.session.user,
            { $addToSet: { wishlist: { productId: productId } } }
        );
        req.session.count.wishlist++;
        res.status(200).json({ redirect: '/wishlist' });
    } catch (error) {
        console.log(error);
    }
}

const handleRemoveFromWishlist = async (req, res) => {
    try {
        console.log(req.query);
        const productId = new ObjectId(req.query.id);

        // Remove the specific product from the wishlist
        req.session.count.wishlist--;
        await User.findByIdAndUpdate(
            req.session.user,
            { $pull: { wishlist: { productId: productId } } }
        );
        res.redirect('/wishlist');
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    renderWishlist,
    handleAddToWishlist,
    handleRemoveFromWishlist
}