const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');
const ObjectId = require('mongoose').Types.ObjectId;

const renderHome = async (req, res) => {
    try {
        if (req.session.passport) {
            req.session.user = req.session.passport.user._id;
        }
        const [products, topSellingProducts] = await Promise.all([
            Product.find({ isBlocked: false }).sort({ _id: -1 }).limit(8),
            Order.aggregate([
                { $match: { status: 'delivered' } }, // Filter orders by status 'delivered'
                { $unwind: '$products' }, // Deconstruct the products array
                {
                    $group: {
                        _id: '$products.productId',
                        totalQuantitySold: { $sum: '$products.quantity' }
                    }
                },
                { $sort: { totalQuantitySold: -1 } },
                { $limit: 8 },
                {
                    $lookup: {
                        from: 'products', // Name of the collection to perform the lookup
                        localField: '_id', // Field from the current collection (Order)
                        foreignField: '_id', // Field from the foreign collection (products)
                        as: 'productDetails' // Alias for the joined documents
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        totalQuantitySold: 0 // Exclude totalQuantitySold field
                    }
                },
                {
                    $replaceRoot: { newRoot: { $arrayElemAt: ['$productDetails', 0] } }
                }
            ])
        ])
        console.log(topSellingProducts);
        res.render('user/home', { home: true, products, user: req.session.user ? req.session.user : false, count: req.session.count, topSellingProducts });
        // res.render('user/order-success');
    } catch (error) {
        console.error(error);
    }
}
const renderShop = async (req, res) => {
    try {
        const productsCount = await Product.find({ isBlocked: false }).countDocuments();
        const products = await Product.find({ isBlocked: false }).limit(8);
        res.render('user/shop', { shopActive: true, products, productsCount, user: req.session.user ? req.session.user : false, count: req.session.count });
    } catch (error) {
        console.log(error);
    }
}

const sortAndFilter = async (req, res) => {
    try {
        console.log(req.body);
        const { sort, filter, search, page } = req.body;
        let pageNumber = parseInt(page);
        pageNumber = pageNumber == 1 ? 0 : (pageNumber - 1) * 8;
        let sortQuery = {};
        if (sort == "") {
            sortQuery = { _id: 1 }
        } else if (sort == "price-low") {
            sortQuery = { promotionalPrice: 1 }
        } else if (sort == "price-high") {
            sortQuery = { promotionalPrice: -1 }
        }
        let filterQuery = {};
        if (filter == "" || filter == "all") {
            filterQuery = { isBlocked: false };
        } else if (filter == "inStock") {
            filterQuery = { isBlocked: false, quantity: { $gt: 0 } };
        }
        let searchQuery = {};
        if (search !== "") {
            searchQuery = { name: { $regex: search, $options: 'i' } }; // Case-insensitive search for product name
        }
        const finalQuery = { ...filterQuery, ...searchQuery };
        const productsCount = await Product.countDocuments(finalQuery);
        console.log(pageNumber);
        const products = await Product.find(finalQuery).sort(sortQuery).limit(8).skip(pageNumber);
        res.status(200).json({ products, productsCount });
    } catch (error) {
        console.log(error);
    }
}

const renderProductDetails = async (req, res) => {
    try {
        const productId = new ObjectId(req.query.id);
        const productDetails = await Product.findById(req.query.id);
        if (req.session.user) {
            const userId = new ObjectId(req.session.user);
            const itemInCart = await User.findOne({ _id: userId, cart: { $elemMatch: { productId: productId } } });
            // console.log(cart);
            return res.render('user/product-details', { user: req.session.user ? true : false, product: productDetails, count: req.session.count, itemInCart });
        }
        // console.log(productDetails);
        res.render('user/product-details', { user: req.session.user ? true : false, product: productDetails });
    } catch (error) {
        console.error(error);
    }
}
module.exports = {
    renderHome,
    renderProductDetails,
    renderShop,
    sortAndFilter
}