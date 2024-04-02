const Brand = require('../../models/brandModel');
const Category = require('../../models/categoryModel');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
    let status = 'Weekly';
    const filter = req.query.filter ? req.query.filter : 'weekly';
    console.log('filter', filter);
    // let salesdata;
    // Get the current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Months are zero-based, so add 1 to get the correct month
    const currentYear = currentDate.getFullYear();

    const [data, productsCount, currentMonthRevenue, recentOrders] = await Promise.all([
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
        Product.find().countDocuments(),
        Order.aggregate([
            {
                $match: {
                    status: "delivered", // Filter only delivered orders
                    createdAt: {
                        $gte: new Date(currentYear, currentMonth - 1, 1), // Start of the current month
                        $lt: new Date(currentYear, currentMonth, 1) // Start of the next month
                    }
                }
            },
            {
                $group: {
                    _id: null, // Group all results
                    totalRevenue: { $sum: "$totalPrice" } // Calculate total revenue for the current month
                }
            }
        ]),
        Order.find({}, { status: 1, total: 1, paymentMethod: 1, createdAt: 1, "address.name": 1, totalPrice: 1 }).sort({ createdAt: -1 }).limit(10)
    ])
    const currentMonthTotalRevenue = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].totalRevenue : 0;

    //////////////////// weekly
    if (filter == 'weekly' || filter == null) {

        // Retrieve recent sales data
        // Execute all aggregate queries concurrently
        const [recentSales, recentUsers, recentProducts] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        status: "delivered",
                        createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } // Filter orders from the beginning of 7 days ago
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
            ]),
            User.aggregate([
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
            ]),
            Product.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } // Filter products created within the last 7 days
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group products by creation date
                        totalProducts: { $sum: 1 } // Count the number of products for each day
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
            ])
        ]);

        console.log('Recent sales:', recentSales);
        console.log('Recent users:', recentUsers);
        console.log('Recent products:', recentProducts);
        console.log('recenkt Orderes', recentOrders);

        // Map sales data to array
        const salesCountArray = mapDataToCountArray(recentSales);

        // Map users data to array
        const usersCountArray = mapDataToCountArray(recentUsers);

        // Map products data to array
        const productsCountArray = mapDataToCountArray(recentProducts);

        // Render dashboard with data
        return res.render('admin/dashboard', {
            dashboardActive: true,
            salesData: salesCountArray,
            filter,
            data,
            productsCount,
            usersData: usersCountArray,
            productsData: productsCountArray,
            currentMonthTotalRevenue,
            recentOrders,
            status
        });

        // Function to map data to count array
        function mapDataToCountArray(data) {
            return Array.from({ length: 7 }, (_, i) => {
                const currentDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const formattedDate = currentDate.toISOString().slice(0, 10); // Format as "YYYY-MM-DD"
                const matchingDay = data.find(day => day.date === formattedDate);
                return matchingDay ? matchingDay.totalSales || matchingDay.totalUsers || matchingDay.totalProducts : 0;
            }).reverse();
        }

    }
    if (filter == 'monthly') {
        status = 'Monthly';
        // Execute all aggregate queries concurrently using Promise.all
        const [salesMonthly, usersMonthly, productsMonthly] = await Promise.all([
            // Retrieve monthly sales data
            Order.aggregate([
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
                        month: "$_id", // Rename _id as month
                        totalSales: 1
                    }
                },
                {
                    $sort: { month: 1 } // Sort by month in ascending order
                }
            ]),
            // Retrieve monthly users data
            User.aggregate([
                {
                    $group: {
                        _id: { $month: "$createdAt" }, // Group by month and year
                        totalUsers: { $sum: 1 } // Calculate total users for each month
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        month: "$_id", // Rename _id as month
                        totalUsers: 1
                    }
                },
                {
                    $sort: { month: 1 } // Sort by month in ascending order
                }
            ]),
            // Retrieve monthly products data
            Product.aggregate([
                {
                    $group: {
                        _id: { $month: "$createdAt" }, // Group by month and year
                        totalProducts: { $sum: 1 } // Calculate total products for each month
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        month: "$_id", // Rename _id as month
                        totalProducts: 1
                    }
                },
                {
                    $sort: { month: 1 } // Sort by month in ascending order
                }
            ])
        ]);

        // Map data to monthly arrays
        const salesMonthlyArray = mapDataToMonthlyArray(salesMonthly);
        const usersMonthlyArray = mapDataToMonthlyArray(usersMonthly);
        const productsMonthlyArray = mapDataToMonthlyArray(productsMonthly);

        console.log('Monthly sales:', salesMonthlyArray);
        console.log('Monthly users:', usersMonthlyArray);
        console.log('Monthly products:', productsMonthlyArray);

        // Render dashboard with data
        res.render('admin/dashboard', {
            dashboardActive: true,
            salesData: salesMonthlyArray,
            filter,
            data,
            productsCount,
            usersData: usersMonthlyArray,
            productsData: productsMonthlyArray,
            currentMonthTotalRevenue,
            recentOrders,
            status
        });

        // Function to map data to monthly array
        function mapDataToMonthlyArray(data) {
            return Array.from({ length: 12 }, (_, index) => {
                const monthData = data.find(item => item.month === index + 1);
                return monthData ? monthData.totalSales || monthData.totalUsers || monthData.totalProducts : 0;
            });
        }

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
        // Extracting fromDate and toDate from query parameters
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;

        // Constructing the filter object based on the provided dates
        const filter = { status: "delivered" };
        if (fromDate && toDate) {
            // Convert the "toDate" string to the end of the day
            const endOfDay = new Date(toDate);
            endOfDay.setHours(23, 59, 59, 999);

            filter.createdAt = { $gte: new Date(fromDate), $lte: endOfDay };
        }

        // Retrieving orders based on the filter
        const orders = await Order.find(filter);

        // Calculating overall sales count, order amount, and discount amount
        const overallSalesCount = await Order.countDocuments(filter);
        const overallOrderAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const overallDiscountAmount = orders.reduce((acc, order) => acc + order.discount, 0);

        // Rendering the sales report template with the retrieved data
        res.render('admin/sales-report', {
            data: orders,
            salesReportActive: true,
            overallSalesCount,
            overallOrderAmount,
            overallDiscountAmount,
            fromDate,
            toDate
        });
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
            { header: 'Date', key: 'date', width: 40 },
            { header: 'Discount', key: 'discount', width: 15 },
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
                discount: order.discount,
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


// const handleDownloadPDF = (req, res) => {
//     try {
//         let tableData = req.body.tableData;

//         // Create a new PDF document
//         const doc = new PDFDocument();

//         // Set the headers for the response to prompt download
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=table.pdf');

//         // Pipe the PDF document to the response
//         doc.pipe(res);

//         // Add table to the PDF document
//         doc.table(tableData, {
//             headers: ['OrderId', 'Customer', 'Country'], // Headers for the table
//             // Custom styling for the table
//             prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12),
//             prepareRow: (row, i) => doc.font('Helvetica').fontSize(12),
//             // Alignment of table cells
//             align: ['left', 'center', 'right']
//         });

//         // Finalize the PDF document
//         doc.end();
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error generating PDF');
//     }
// };



const handleDownloadPDF = (req, res) => {
    try {
        const doc = new PDFDocument();
        const filename = 'sales-report.pdf';
        const orders = req.body.tableData;
        // console.log(orders);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);
        doc.fontSize(12);
        doc.text('Sales Report', { align: 'center', fontSize: 16 });
        const margin = 5;
        doc
            .moveTo(margin, margin)
            .lineTo(600 - margin, margin)
            .lineTo(600 - margin, 842 - margin)
            .lineTo(margin, 600 - margin)
            .lineTo(margin, margin)
            .lineTo(600 - margin, margin)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();

        doc.moveDown();


        const headers = ['Order ID', 'Name', 'Date', 'Total'];

        let headerX = 20;
        const headerY = doc.y + 10;

        doc.text(headers[0], headerX, headerY);
        headerX += 200;

        headers.slice(1).forEach(header => {
            doc.text(header, headerX, headerY);
            headerX += 130;
        });

        let dataY = headerY + 25;

        orders.forEach(order => {
            const cleanedDataId = order.orderId.trim();
            const cleanedName = order.name.trim();

            doc.text(cleanedDataId, 20, dataY, { width: 200 });
            doc.text(cleanedName, 230, dataY, { width: 130 });
            doc.text(cleanedDate, 300, dataY, { width: 130 });
            doc.text(order.totalAmount, 490, dataY);

            dataY += 30;
        });



        doc.end();
    } catch (error) {
        console.log(error.message);
    }
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
    dateWiseFiter,
    handleDownloadPDF
}