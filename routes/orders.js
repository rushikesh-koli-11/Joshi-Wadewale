const express = require('express');
const router = express.Router();
const Order = require('../models/orders');
const PDFDocument = require('pdfkit');



// Render order page for selected table
router.get('/:tableNumber', async (req, res) => {
    const tableNumber = req.params.tableNumber;
    res.render('order', { tableNumber, snacks });
});

// Place an order and calculate total price
router.post('/:tableNumber', async (req, res) => {
    const tableNumber = req.params.tableNumber;
    let items = [];
    let totalAmount = 0;

    for (let snack in req.body.snacks) {
        if (req.body.snacks[snack].checked) {
            const quantity = req.body.snacks[snack].quantity;
            const price = snacks[snack];
            const totalPrice = quantity * price;

            items.push({ snackName: snack, quantity, price, totalPrice });
            totalAmount += totalPrice;
        }
    }

    const newOrder = new Order({
        tableNumber,
        items,
        totalAmount
    });

    await newOrder.save();
    res.redirect(`/orders/${tableNumber}/pdf`);
});

// Generate PDF of order details
router.get('/:tableNumber/pdf', async (req, res) => {
    const tableNumber = req.params.tableNumber;

    // Fetch the order from the database
    const order = await Order.findOne({ tableNumber });

    if (!order) {
        return res.status(404).send('Order not found');
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-table-${tableNumber}.pdf`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Title of the PDF
    doc.fontSize(20).text(`Order for Table ${tableNumber}`, { align: 'center' });
    doc.moveDown();

    // List all the ordered snacks with quantities and price
    doc.fontSize(12).text('Ordered Items:', { underline: true });
    order.items.forEach(item => {
        doc.text(`${item.snackName} - ₹${item.price} x ${item.quantity} = ₹${item.totalPrice}`);
    });
    doc.moveDown();

    // Total amount
    doc.fontSize(14).text(`Total Amount: ₹${order.totalAmount}`, { bold: true });

    // Finalize the PDF and end the stream
    doc.end();
});

// Reset order for table
router.post('/:tableNumber/reset', async (req, res) => {
    await Order.deleteMany({ tableNumber: req.params.tableNumber });
    res.redirect('/');
});

module.exports = router;
