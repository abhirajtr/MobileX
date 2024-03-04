const shortid = require('shortid');


const timestamp = new Date().getTime(); // Get current timestamp

    // Generate a unique order ID with date
    const orderId = `${timestamp}-${shortid.generate()}`;

console.log(orderId);