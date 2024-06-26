const { default: mongoose } = require('mongoose');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Coupon = require('../../models/couponModel');
const Address = require('../../models/addressModel');
const generateOrderID = require('../../configs/generateOrderId');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

var instance = new Razorpay({
    key_id: 'rzp_test_2hyTCJ2qBkwleR',
    key_secret: 'gJQKhh0UcUekJlYa3oqdKttw',
});

const handlePlaceOrder = async (req, res) => {
    try {
        const { paymentMethod, address, coupon, discount } = req.body;
        const couponDiscount = parseInt(discount)
        if (coupon != '') {
            await Coupon.updateOne({ couponCode: coupon }, { $push: { redeemedUsers: req.session.user } });
        }
        console.log(req.body);
        // return;
        const addressId = new mongoose.Types.ObjectId(address);
        const userId = new mongoose.Types.ObjectId(req.session.user);
        // This is for buyNow
        if (req.session.productId) {
            const productId = new ObjectId(req.session.productId);
            console.log('pid', productId);
            delete req.session.productId;
            const [orderAddress, findProduct] = await Promise.all([
                Address.findOne({ userId: userId, "address._id": addressId }, { "address.$": 1 }),
                Product.findById(productId),
            ]);
            const p = await Product.findById(productId);
            console.log('>>>>>>>', findProduct);

            const product = [{
                productId: productId,
                productName: findProduct.name,
                brand: findProduct.brand,
                quantity: 1,
                ram: findProduct.ram,
                storage: findProduct.storage,
                color: findProduct.color,
                image: findProduct.image[0],
                price: findProduct.promotionalPrice,
                subtotal: findProduct.promotionalPrice,
                orginalPrice: findProduct.regularPrice
            }]
            let totalPrice = findProduct.promotionalPrice - couponDiscount;
            if (paymentMethod == 'wallet') {
                const Balance = await User.findById(req.session.user, { _id: 0, walletBalance: 1 });
                const currentBalance = Balance.walletBalance;
                const updatedBalance = currentBalance - req.session.totalPrice;
                const updatedUser = await User.findByIdAndUpdate(
                    req.session.user,
                    {
                        $inc: { walletBalance: -req.session.totalPrice }, // Increment the wallet balance
                        $push: {
                            walletHistory: { // Push a new transaction object to the wallet history array
                                type: "Debit", // Type of transaction (e.g., credit)
                                amount: req.session.totalPrice, // Amount credited
                                balance: updatedBalance, // Updated wallet balance after the credit
                                date: Date.now(),
                                description: 'Product purchase'
                            }
                        }
                    },
                    { new: true } // Return the updated document after the update is applied
                );
            }
            let findalDiscount;
            if (product[0].orginalPrice - product[0].price < 0) {
                findalDiscount = 0
            } else {
                findalDiscount = product[0].orginalPrice - product[0].price
            }
            const newOrder = new Order({
                userId: userId,
                products: product,
                paymentMethod: paymentMethod,
                totalPrice: totalPrice,
                status: 'verified',
                address: orderAddress.address[0],
                discount: findalDiscount,
                coupon: 1,
            });

            const updateProductPromise = Product.updateOne(
                { _id: productId },
                { $inc: { quantity: -1, purchaseCount: 1 } }
            );

            const saveOrderPromise = newOrder.save();

            await Promise.all([updateProductPromise, saveOrderPromise]);
            return res.status(200).json({ status: 'success', redirect: '/order-success' });
        }
        // buyNow end

        // cart products
        const [orderAddress, userCart] = await Promise.all([
            Address.findOne({ userId: userId, "address._id": addressId }, { "address.$": 1 }),
            User.aggregate([
                {
                    $match: {
                        _id: userId
                    }
                },
                {
                    $unwind: "$cart"
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "cart.productId",
                        foreignField: "_id",
                        as: 'cartProducts'
                    }
                },
                {
                    $unwind: "$cartProducts"
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$_id",
                        productId: "$cartProducts._id",
                        name: "$cartProducts.name",
                        brand: "$cartProducts.brand",
                        quantity: "$cart.quantity",
                        ram: "$cartProducts.ram",
                        storage: "$cartProducts.storage",
                        color: "$cartProducts.color",
                        image: { $arrayElemAt: ["$cartProducts.image", 0] },
                        price: "$cartProducts.promotionalPrice",
                        orginalPrice: "$cartProducts.regularPrice"
                    }
                }
            ])
        ])
        // console.log('usrsjasj',userCart);
        if (paymentMethod == 'razorpay') {
            const orderData = userCart.map(cartItem => ({
                productId: cartItem.productId,
                productName: cartItem.name,
                brand: cartItem.brand,
                quantity: cartItem.quantity,
                ram: cartItem.ram,
                storage: cartItem.storage,
                color: cartItem.color,
                image: cartItem.image,
                price: cartItem.price,
                subtotal: cartItem.quantity * cartItem.price,
                orginalPrice: cartItem.orginalPrice
            }));
            req.session.orderData = orderData;
            let totalPrice = orderData.reduce((total, item) => total + item.quantity * item.price, 0);
            totalPrice = totalPrice - couponDiscount;
            totalPrice += 40;
            const originalPrice = orderData.reduce((total, item) => total + item.quantity * item.orginalPrice, 0);
            // const discount = originalPrice - totalPrice;
            let findalDiscount;
            if (originalPrice - totalPrice < 0) {
                findalDiscount = 0
            } else {
                findalDiscount = originalPrice - totalPrice
            }
            const newOrder = new Order({
                userId: userId,
                products: orderData,
                paymentMethod: paymentMethod,
                status: 'payment failed',
                totalPrice: totalPrice,
                address: orderAddress.address[0],
                discount: findalDiscount
            });

            await Promise.all([
                newOrder.save(),
                User.findByIdAndUpdate(userId, { $set: { cart: [] } })
            ])
            req.session.orderId = newOrder._id;
            req.session.count.cart = 0;
            const amount = String(totalPrice * 100);
            var options = {
                amount: amount,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "order_rcptid_11"
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                if (!err) {
                    res.status(200).json({ paymentMethod: 'razorpay', orderId: order.id });
                }
            });
        }
        else {
            // cash on delivery and wallet
            const orderData = userCart.map(cartItem => ({
                productId: cartItem.productId,
                productName: cartItem.name,
                brand: cartItem.brand, // Optional: Include brand if available
                quantity: cartItem.quantity,
                ram: cartItem.ram,
                storage: cartItem.storage,
                color: cartItem.color,
                image: cartItem.image,
                price: cartItem.price,
                subtotal: cartItem.quantity * cartItem.price,
                orginalPrice: cartItem.orginalPrice
            }));
            // console.log(orderData);
            let totalPrice = orderData.reduce((total, item) => total + item.quantity * item.price, 0);
            totalPrice = totalPrice - couponDiscount;
            totalPrice += 40;
            let originalPrice = orderData.reduce((total, item) => total + item.quantity * item.orginalPrice, 0);
            const discount = originalPrice - totalPrice;
            console.log('offer:', discount);
            if (paymentMethod == 'wallet') {
                const Balance = await User.findById(req.session.user, { _id: 0, walletBalance: 1 });
                const currentBalance = Balance.walletBalance;
                const updatedBalance = currentBalance - totalPrice;
                const updatedUser = await User.findByIdAndUpdate(
                    req.session.user,
                    {
                        $inc: { walletBalance: - totalPrice }, // Increment the wallet balance
                        $push: {
                            walletHistory: { // Push a new transaction object to the wallet history array
                                type: "Debit", // Type of transaction (e.g., credit)
                                amount: totalPrice, // Amount credited
                                balance: updatedBalance, // Updated wallet balance after the credit,
                                description: 'Product Purchase',
                                date: Date.now()
                            }
                        }
                    },
                    { new: true } // Return the updated document after the update is applied
                );
            }
            const newOrder = new Order({
                userId: userId,
                products: orderData,
                paymentMethod: paymentMethod,
                status: 'verified',
                totalPrice: totalPrice,
                address: orderAddress.address[0],
                discount: discount
            });
            await Promise.all([
                newOrder.save(),
                User.findByIdAndUpdate(userId, { $set: { cart: [] } }),
                ...orderData.map(async (item) => {
                    await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity, purchaseCount: item.quantity } });
                })
            ])
            req.session.count.cart = 0;
            res.status(200).json({ status: 'success', redirect: '/order-success' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'error', message: 'Failed to place order.' });
    }
}

const verifypayment = async (req, res) => {
    console.log(req.body);
    const paymentInfo = req.body.response;
    const orderId = new ObjectId(req.session.orderId);
    delete req.session.orderId;
    const { orderData } = req.session;
    delete req.session.orderData;
    // console.log('payment info', paymentInfo);
    // Construct the string to be signed
    const signatureString = `${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`;
    // Recalculate the signature using your Razorpay secret
    const expectedSignature = crypto.createHmac('sha256', 'gJQKhh0UcUekJlYa3oqdKttw')
        .update(signatureString)
        .digest('hex');
    // Compare the recalculated signature with the signature received from Razorpay
    if (expectedSignature === paymentInfo.razorpay_signature) {
        // console.log('Payment verified');
        await Order.findByIdAndUpdate(
            orderId, // Replace with the actual order ID
            { $set: { status: 'verified' } }
        );

        // console.log('o', orderData);
        await Promise.all(orderData.map(async (item) => {
            await Product.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity, purchaseCount: item.quantity } });
        }));

        res.status(200).json({ redirect: '/order-success', user: req.session.user });
    } else {
        // Payment verification failed
        console.error('Payment verification failed');
        return false;
    }
}

// const handleCancelOrder = async (req, res) => {
//     try {
//         console.log(1);
//         console.log(req.body);
//         const orderId = new mongoose.Types.ObjectId(req.body.orderId);
//         const productId = new mongoose.Types.ObjectId(req.body.productId);
//         const updatedOrder = await Order.findOneAndUpdate({ _id: orderId, "products.productId": productId }, {
//             $set: { "products.$.status": "cancelled" }
//         });
//         await Product.findOneAndUpdate({ _id: productId }, { $inc: { quantity: updatedOrder.products[0].quantity, purchaseCount: -updatedOrder.products[0].quantity } });
//         res.status(200).json({ status: 'success' });
//     } catch (error) {
//         console.error(error);
//     }
// }
const renderOrderSuccess = (req, res) => {
    // req.session.cout.cart = 
    res.render('user/order-success', { user: req.session.user, count: req.session.count });
}

const handleReturnProduct = async (req, res) => {
    try {
        console.log(1);
        const orderId = new mongoose.Types.ObjectId(req.query.id);
        // const productId = new mongoose.Types.ObjectId(req.body.productId);
        const updatedOrder = await Order.findOneAndUpdate({ _id: orderId }, {
            $set: { status: "returned" }
        });
        // const amount = parseInt(req.body.amount);
        const amount = updatedOrder.totalPrice;
        const user = await User.findById(req.session.user);
        const updatedBalance = user.walletBalance + amount;
        const updatedUser = await User.findByIdAndUpdate(req.session.user, {
            $inc: { walletBalance: amount },
            $push: {
                walletHistory: {
                    type: "credit",
                    amount: amount,
                    balance: updatedBalance, // Use the calculated updated balance here
                    description: 'Product return',
                    date: Date.now()
                }
            }
        }, { new: true });


        // await Product.findOneAndUpdate({ _id: productId }, { $inc: { quantity: updatedOrder.products[0].quantity, purchaseCount: -updatedOrder.products[0].quantity } });
        // res.status(200).json({ status: 'success' });
        res.redirect(`/order-details?id=${orderId}`)
    } catch (error) {
        console.error(error);
    }
}

const handleCancelOrder = async (req, res) => {
    try {
        console.log(1);
        // console.log(req.body);
        const orderId = new mongoose.Types.ObjectId(req.query.id);
        // const productId = new mongoose.Types.ObjectId(req.body.productId);
        // const updatedOrder = await Order.findOneAndUpdate({ _id: orderId, "products.productId": productId }, {
        //     $set: { "products.$.status": "cancelled" }
        // });
        const cancelOrder = await Order.findByIdAndUpdate(orderId, { $set: { status: 'cancelled' } });
        console.log(cancelOrder);
        // await Product.findOneAndUpdate({ _id: productId }, { $inc: { quantity: updatedOrder.products[0].quantity, purchaseCount: -updatedOrder.products[0].quantity } });
        // res.status(200).json({ status: 'success' });
        cancelOrder.products.forEach(async (product) => {
            // Update the quantity in the Product collection
            await Product.findByIdAndUpdate(
                product.productId,
                { $inc: { quantity: product.quantity, purchaseCount: -product.quantity } }, // Increment the quantity by the product's quantity
                { new: true } // Return the updated document
            );
        });

        if ((cancelOrder.paymentMethod === 'razorpay' || cancelOrder.paymentMethod === 'wallet') && cancelOrder.status !== 'payment failed') {
            const user = await User.findById(req.session.user, { walletBalance: 1 });
            const updatedBalance = user.walletBalance + cancelOrder.totalPrice;
            const updatedUser = await User.findByIdAndUpdate(req.session.user, {
                $inc: { walletBalance: cancelOrder.totalPrice },
                $push: {
                    walletHistory: {
                        type: "credit",
                        amount: cancelOrder.totalPrice,
                        balance: updatedBalance, // Use the calculated updated balance here
                        description: 'Product cancellation',
                        date: Date.now()
                    }
                }
            }, { new: true });
        }
        res.redirect(`/order-details?id=${orderId}`);
    } catch (error) {
        console.error(error);
    }
}
const payPending = async (req, res) => {
    console.log(req.body);
    let { orderId } = req.body;
    orderId = new ObjectId(orderId);
    req.session.orderId = orderId;
    const data = await Order.findById(orderId, { totalPrice: 1 });
    console.log(data);
    const totalPrice = data.totalPrice;
    console.log(totalPrice);
    const amount = String(totalPrice * 100);
    var options = {
        amount: amount,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function (err, order) {
        console.log(order);
        if (!err) {
            res.status(200).json({ paymentMethod: 'razorpay', orderId: order.id });
        }
    });
}

const verifypaymentPending = async (req, res) => {
    console.log(req.body);
    const paymentInfo = req.body.response;
    const orderId = new ObjectId(req.session.orderId);
    delete req.session.orderId;
    // Construct the string to be signed
    const signatureString = `${paymentInfo.razorpay_order_id}|${paymentInfo.razorpay_payment_id}`;
    // Recalculate the signature using your Razorpay secret
    const expectedSignature = crypto.createHmac('sha256', 'gJQKhh0UcUekJlYa3oqdKttw')
        .update(signatureString)
        .digest('hex');
    // Compare the recalculated signature with the signature received from Razorpay
    if (expectedSignature === paymentInfo.razorpay_signature) {
        // console.log('Payment verified');
        await Order.findByIdAndUpdate(
            orderId, // Replace with the actual order ID
            { $set: { status: 'verified' } }
        );

        res.status(200).json({ redirect: '/order-success', user: req.session.user });
    } else {
        // Payment verification failed
        console.error('Payment verification failed');
        return false;
    }
}
var easyinvoice = require('easyinvoice');
var fs = require('fs');
const handleInvoiceDownload = async (req, res) => {
    try {
        // Validate the orderId query parameter
        if (!req.query.orderId) {
            return res.status(400).send({ error: 'Order ID is required' });
        }

        // Fetch the order data
        const orderData = await Order.findOne({ _id: req.query.orderId }, { products: 1, discount: 1, totalPrice: 1 , address: 1});

        // Check if the order exists
        if (!orderData) {
            return res.status(404).send({ error: 'Order not found' });
        }

        // Map the products to the required format
        const products = orderData.products.map(product => ({
            quantity: product.quantity,
            description: `${product.productName} - ${product.brand}`, // Customize as needed
            price: product.price,
            total: product.subtotal
        }));
        const discount = orderData.discount;
        const totalPrice = orderData.totalPrice;
        products.push(
            // { description: 'Discount', price: -discount, total: -discount },
            { description: 'Shipping', price: 40, total: 40 },
        );
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
        // Prepare the invoice data
        const data = {
            "currency": "INR",
            "taxNotation": "vat", //or gst
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
            "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png", //or base64
            "information": {
                // Invoice number
                number: "2021.0001",
                // Invoice data
                date: formattedDate,
            },
            "fields": {
                "tax": false,
                "discounts": {
                    "discount": {
                        "amount": discount,
                        "description": "Discount"
                    }
                },
                "shipping": {
                    "amount": 40,
                    "description": "Shipping"
                },
                "total": {
                    "amount": totalPrice,
                    "label": "Total"
                }
            },
            "sender": {
                "company": "Mobiex",
                "address": "Street 123",
                "zip": "1234 AB",
                "city": "Mumbai",
                "country": "India"
            },
            "client": {
                "address": orderData.address.name,
                "zip": orderData.address.pincode,
                "city": orderData.address.city,
                "country": "India"
            },
            "invoiceNumber": "20220402",
            "invoiceDate": new Date().toISOString(), // Use ISO string format for consistency
            "products": products,
            "shipping": 40,
            "bottomNotice": "Kindly pay your invoice within 15 days."
        };

        // Generate the invoice
        const result = await easyinvoice.createInvoice(data);
        const pdfBuffer = Buffer.from(result.pdf, 'base64');

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while generating the invoice' });
    }
}




module.exports = {
    handlePlaceOrder,
    handleCancelOrder,
    verifypayment,
    renderOrderSuccess,
    handleReturnProduct,
    payPending,
    verifypaymentPending,
    handleInvoiceDownload
}