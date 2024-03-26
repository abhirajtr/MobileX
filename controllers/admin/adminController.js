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
const renderDashboard = async (req, res) => {
    const filter = req.query.filter ? req.query.filter : 'weekly';
    console.log('filter', filter);
    // let salesdata;
    const [data, productsCount] = await Promise.all([
        Order.aggregate([
            { $match: { status: 'delivered' } }, // Filter only delivered orders
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' }, // Calculate the sum of total price for all orders
                    totalOrders: { $sum: 1 } // Count the number of orders
                }
            }
        ]),
        Product.find().countDocuments()
    ])
    //////////////////// weekly
    if (filter == 'weekly' || filter == null) {
        const recentSales = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000) } // Filter orders from the beginning of 7 days ago
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date
                    totalSales: { $sum: 1 } // Calculate total sales for each day
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as date
                    totalSales: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by date in ascending order
            }
        ]);
        const salesCountArray = Array.from({ length: 7 }, (_, i) => {
            const currentDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const formattedDate = currentDate.toISOString().slice(0, 10); // Format as "YYYY-MM-DD"
            const matchingDay = recentSales.find(day => day.date === formattedDate);
            return matchingDay ? matchingDay.totalSales : 0;
        }).reverse();
        console.log('s>>>',salesCountArray);
        const recentUsers = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } // Filter users created within the last 7 days
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group users by creation date
                    totalUsers: { $sum: 1 } // Count the number of users for each day
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as date
                    totalUsers: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by date in ascending order
            }
        ]);
        
        console.log(recentUsers);
        
        const usersCountArray = Array.from({ length: 7 }, (_, i) => {
            const currentDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const formattedDate = currentDate.toISOString().slice(0, 10); // Format date as "YYYY-MM-DD"
            const usersSignedUpOnDay = recentUsers.find(day => day.date === formattedDate);
            return usersSignedUpOnDay ? usersSignedUpOnDay.totalUsers : 0; // Access 'totalUsers' property instead of 'userCount'
        }).reverse();        
        console.log('u>>>', usersCountArray);
        const recentProducts = await Product.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000) } // Filter orders from the beginning of 7 days ago
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date
                    totalProducts: { $sum: 1 } // Calculate total sales for each day
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as date
                    totalProducts: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by date in ascending order
            }
        ]);
        const productsCountArray = Array.from({ length: 7 }, (_, i) => {
            const currentDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const formattedDate = currentDate.toISOString().slice(0, 10); // Format as "YYYY-MM-DD"
            const usersSignedUpOnDay = recentProducts.find(day => day.date === formattedDate);
            return usersSignedUpOnDay ? usersSignedUpOnDay.userCount : 0;
        }).reverse();
        return res.render('admin/dashboard', { dashboardActive: true, salesData: salesCountArray, filter, data, productsCount, usersData: usersCountArray, productsData: productsCountArray });
    }
    if (filter == 'monthly') {
        const salesMonthly = await Order.aggregate([
            {
                $match: { status: "delivered" } // Filter only delivered orders
            },
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by month and year
                    totalSales: { $sum: 1 } // Calculate total sales for each month
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as month
                    totalSales: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by month in ascending order
            }
        ]);

        const monthlySalesArray = Array.from({ length: 12 }, (_, index) => {
            const monthData = salesMonthly.find(item => item.date === index + 1);
            return monthData ? monthData.totalSales : 0; // Fixed property name 'count' to 'totalSales'
        });
        const salesMonthlyArray = Array.from(monthlySalesArray);
        console.log(salesMonthlyArray);
        const usersMonthly = await Order.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by month and year
                    totalUsers: { $sum: 1 } // Calculate total sales for each month
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as month
                    totalUsers: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by month in ascending order
            }
        ]);
        const monthlyUsersArray = Array.from({ length: 12 }, (_, index) => {
            const monthData = salesMonthly.find(item => item.date === index + 1);
            return monthData ? monthData.totalUsers : 0; // Fixed property name 'count' to 'totalSales'
        });
        const productsMonthly = await Order.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by month and year
                    totalProducts: { $sum: 1 } // Calculate total sales for each month
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as month
                    totalProducts: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by month in ascending order
            }
        ]);

        const monthlyProductsArray = Array.from({ length: 12 }, (_, index) => {
            const monthData = salesMonthly.find(item => item.date === index + 1);
            return monthData ? monthData.totalSales : 0; // Fixed property name 'count' to 'totalSales'
        });
        res.render('admin/dashboard', { dashboardActive: true, salesData: salesMonthlyArray, filter, data, productsCount, usersData: monthlyUsersArray, productsData: monthlyProductsArray  });
    } else {
        const salesDataYearly = await Order.aggregate([
            {
                $match: { status: "delivered" } // Filter only delivered orders
            },
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by month and year
                    totalSales: { $sum: 1 } // Calculate total sales for each month
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    date: "$_id", // Rename _id as month
                    totalSales: 1
                }
            },
            {
                $sort: { date: 1 } // Sort by month in ascending order
            }
        ]);

    }

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
        const overallSalesCount = await Order.find({ status: "delivered" }).countDocuments();
        const overallOrderAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const overallDiscountAmount = orders.reduce((acc, order) => acc + order.discount, 0);
        console.log(orders);
        res.render('admin/sales-report', { data: orders, salesReportActive: true, overallSalesCount, overallOrderAmount, overallDiscountAmount })
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
    }).sort({ createdAt: -1 });

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

const getWeeklySalesData = async () => {
    const recentSales = await Order.aggregate([
        {
            $match: {
                status: "delivered",
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000) } // Filter orders from the beginning of 7 days ago
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date
                totalSales: { $sum: 1 } // Calculate total sales for each day
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id field
                date: "$_id", // Rename _id as date
                totalSales: 1
            }
        },
        {
            $sort: { date: 1 } // Sort by date in ascending order
        }
    ]);

    return getSalesCountArray(recentSales, 7);
};

const getMonthlySalesData = async () => {
    const salesMonthly = await Order.aggregate([
        {
            $match: { status: "delivered" } // Filter only delivered orders
        },
        {
            $group: {
                _id: { $month: "$createdAt" }, // Group by month
                totalSales: { $sum: 1 } // Calculate total sales for each month
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id field
                date: "$_id", // Rename _id as month
                totalSales: 1
            }
        },
        {
            $sort: { date: 1 } // Sort by month in ascending order
        }
    ]);

    const monthlySalesArray = Array.from({ length: 12 }, (_, index) => {
        const monthData = salesMonthly.find(item => item.date === index + 1);
        return monthData ? monthData.totalSales : 0;
    });

    return Array.from(monthlySalesArray);
};

const getYearlySalesData = async () => {
    const salesDataYearly = await Order.aggregate([
        {
            $match: { status: "delivered" } // Filter only delivered orders
        },
        {
            $group: {
                _id: { $year: "$createdAt" }, // Group by year
                totalSales: { $sum: 1 } // Calculate total sales for each year
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id field
                date: "$_id", // Rename _id as year
                totalSales: 1
            }
        },
        {
            $sort: { date: 1 } // Sort by year in ascending order
        }
    ]);

    return salesDataYearly;
};

const getSalesCountArray = (salesData, days) => {
    return Array.from({ length: days }, (_, i) => {
        const currentDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const formattedDate = currentDate.toISOString().slice(0, 10);
        const matchingDay = salesData.find(day => day.date === formattedDate);
        return matchingDay ? matchingDay.totalSales : 0;
    }).reverse();
};



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