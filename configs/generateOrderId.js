function generateOrderID() {
    const timestamp = Date.now().toString(); // Get current timestamp as a string
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // Generate a random number between 0 and 9999, then pad it to ensure it's always 4 digits
    const orderID = timestamp + randomNum; // Concatenate timestamp and random number
    return orderID;
}

module.exports = generateOrderID;