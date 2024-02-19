const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const MONGOOSE_URI = process.env.MONGOOSE_URI;
        await mongoose.connect(MONGOOSE_URI);
        console.log('Database Connection Successful');
    } catch (error) {
        console.log('Database Connection Failed: ', error);
    }
}

module.exports = connectDB();