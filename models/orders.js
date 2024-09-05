const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    tableNumber: {
        type: Number,
        required: true
    },
    items: [
        {
            snackName: String,
            quantity: Number,
            price: Number,
            totalPrice: Number
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
