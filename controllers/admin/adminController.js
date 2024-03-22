const Brand = require('../../models/brandModel');
const Category = require('../../models/categoryModel');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const ExcelJS = require('exceljs');

const renderLogin = (req, res) => {
    res.render('admin/login');
}
const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const foundAdmin = await User.findOne({ email, isAdmin: true });
        console.log(foundAdmin);
        if (!foundAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        if (! await foundAdmin.comparePassword(password)) {
            return res.status(403).json({ error: 'Inavlid Password' });
        }
        req.session.admin = foundAdmin.email;
        res.status(200).json({ redirect: '/admin/dashboard' });
    } catch (error) {
        console.error(error);
    }
}
const renderDashboard = (req, res) => {
    res.render('admin/dashboard', { dashboardActive: true });
}


const renderCategory = async (req, res) => {
    try {
        const category = await Category.find();
        // console.log(category);
        res.render('admin/category', { category });
    } catch (error) {
        console.error(error);
    }
}
const handleCreateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const foundCategory = await Category.findOne({ name });
        if (foundCategory) {
            return res.status(409).json({ error: 'Category name already found' });
        }
        const newCategory = new Category({ name, description });
        const savedCategory = await newCategory.save();
        console.log(savedCategory);
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const handleUnlistCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.query.id, { $set: { isListed: false } });
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const handleListCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.query.id, { $set: { isListed: true } });
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
}
const renderEditCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.query.id);
        res.render('admin/edit-category', { category });
    } catch (error) {
        console.error(error);
    }
}
const handleEditCategory = async (req, res) => {
    try {
        console.log('edit', req.body);
        const { id, name, description } = req.body;
        const updated = await Category.findByIdAndUpdate(id, { name, description });
        res.status(200).json({ redirect: '/admin/category' });
    } catch (error) {
        if (error.code === 11000) {
            res.status(409).json({ error: `${error.keyValue.name} already exist` });
        }
        console.error(error);
    }
}

const handleLogout = (req, res) => {
    delete req.session.admin;
    res.redirect('/admin/login');
}

const renderSalesReport = async (req, res) => {
    try {
        const orders = await Order.find({ status: "delivered" })


        console.log(orders);
        res.render('admin/sales-report', { data: orders, salesReportActive: true })
    } catch (error) {
        console.error(error);
    }
}

const getSalesData = async (req, res) => {
    var option = req.query.option;
    console.log('hit', req.query);
    let startDate, endDate;
    console.log(option);

    // Determine the start and end dates based on the selected option
    switch (option) {
        case 'salesToday':
            startDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
            endDate = new Date(new Date().setUTCHours(23, 59, 59, 999));
            break;
        case 'salesWeekly':
            startDate = new Date(new Date().setDate(new Date().getDate() - 7));
            endDate = new Date();
            break;
        case 'salesMonthly':
            startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
            endDate = new Date();
            break;
        case 'salesYearly':
            startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
            endDate = new Date();
            break;
        default:
            return res.status(400).json({ error: 'Invalid option' });
    }

    // const orders = await Order.aggregate([
    //     {
    //         $lookup: {
    //             from: "users",
    //             localField: "userId",
    //             foreignField: "_id",
    //             as: "user"
    //         }
    //     },
    //     {
    //         $unwind: "$user"
    //     },
    //     {
    //         $project: {
    //             userName: "$user.username",
    //             products: {
    //                 $filter: {
    //                     input: "$products",
    //                     as: "product",
    //                     cond: { $eq: ["$$product.status", "delivered"] }
    //                 }
    //             },
    //             paymentMethod: 1, // Include the paymentMethod field in the output
    //             createdAt: 1
    //         }
    //     },
    //     {
    //         $match: {
    //             "products": { $ne: [] },
    //             "createdAt": { $gte: startDate, $lt: endDate } // Use the determined date range
    //         }
    //     },
    //     {
    //         $unwind: "$products"
    //     }
    // ]).sort({ createdAt: -1 });

    const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: "delivered"
    }).sort({ createdAt: -1});

    res.json(orders);
};
const dateWiseFiter = async (req, res) => {
    try {
        const date = req.query.date;
        const selectedDate = new Date(date);
        console.log(date);

        // Get the start and end of the selected date
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

        // Find delivered orders for the selected date
        const orders = await Order.find({
            "createdAt": { $gte: startDate, $lte: endDate }, // Filter by createdAt within the selected date
            "status": "delivered" // Ensure at least one product is delivered
        });
        console.log(orders);
        res.status(200).json({ orders });

    } catch (error) {
        console.error(error);
    }
}

const downloadExcel = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 50 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Date', key: 'date', width: 30 },
            { header: 'Total', key: 'totalAmount', width: 15 },
            { header: 'Payment', key: 'payment', width: 15 },
        ];

        const orders = req.body;
        console.log(req.body);

        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId,
                customer: order.name,
                date: order.date,
                payment: order.payment,
                totalAmount: order.totalAmount,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=salesReport.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderLogin,
    handleLogin,
    renderDashboard,
    renderCategory,
    handleCreateCategory,
    handleListCategory,
    handleUnlistCategory,
    renderEditCategory,
    handleEditCategory,
    handleLogout,
    renderSalesReport,
    getSalesData,
    downloadExcel,
    dateWiseFiter
}