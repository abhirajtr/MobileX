// multerConfig.js

const multer = require('multer');

// Define storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/product-images') // Uploads directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '.jpg'); // Unique file name
    }
});

// Initialize Multer with storage options
const upload = multer({ storage: storage });

module.exports = upload;