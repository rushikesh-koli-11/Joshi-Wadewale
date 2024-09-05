const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const pdfkit = require('pdfkit');
const Order = require('./models/orders'); // Import Order model

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
// mongoose.connect('mongodb+srv://rushikeshkoli8740:JdUkWAOn4QMy4MR5@cluster0.dkzu6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false
// })
// mongoose.connect('mongodb+srv://rushiikoli:rushii%4012345@cluster0.dz6sb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
//   .then(() => console.log('Connected to MongoDB Atlas'))
//   .catch((err) => console.error('Error connecting to MongoDB Atlas', err));

mongoose.connect('mongodb+srv://rushikeshkoli8740:JdUkWAOn4QMy4MR5@cluster0.dkzu6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    tlsAllowInvalidCertificates: true // Optional, disable for production
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB', err));





    
// Snack pricing
const snacks = {
    "Vadapav": 20,
    "BatataVada": 15,
    "Bread Patice": 35,
    "Tea": 12,
    "Special Tea": 20,
    "Coffee": 15,
    "Kanda Bhaji": 50,
    "Batata Bhaji": 40,
    "Mix Bhaji": 60,
    "Shabhu Khichidi": 50,
    "Shubhu Vada": 50,
    "Pohe": 30,
    "Upama": 30,
    "Shira": 30,
    "Spe. Misalpav": 70,
    "Idli Sambar": 50,
    "Mendu Vada Sambar": 50,
    "Batata Vada Sambar" : 50,
    "Idli Vada Sambar" : 50,
    "Amul Pavbhaji" : 70,
    "Amul Cheese Pavbhaji" : 90,
    "Plain Maggi" : 40,
    "Masala Maggi" : 50,
    "Cheese Masala Maggi" : 70,
    "Cheese Maggi" : 55,
    "Masala Dosa" : 60,
    "Butter Masala Dosa" : 70,
    "Plain Dosa" : 50,
    "Cheese Masala Dosa" : 80,
    "Masala Cut Dosa" : 70,
    "Paper Masala Dosa" : 80,
    "Plan Cheese Dosa" : 75,
    "Onion Uttappa" : 60,
    "Tomato Uttappa" : 70,
    "Cheese Onion Uttappa" : 80,
    "Cheese Tomato Uttappa" : 80,
    "Veg Pulav" : 80,
    "Puri Bhaji" : 55,
    "Chapati Bhaji" : 55,
    "Mini Thali" : 65,
    "Rice plate" : 90,
    "Dal Rice" : 40,
    "Aloo Paratha" : 60,
    "Aloo Cheese Paratha" : 80,
    "Panner Paratha" : 100,
    "French Frise" : 70,
    "Lassi" : 40,
    "Masala Tak" : 30,
    "Thakkar Cold Drink" : 35,
    "Extra Chapati": 10
    
};

// Index page to show tables
app.get('/', (req, res) => {
    res.render('index', { tableCount: 8 });  // Render index with 8 tables
});

// Show the order page for a specific table
app.get('/orders/:tableNumber', async (req, res) => {
    const tableNumber = req.params.tableNumber;

    // Fetch existing order for the table
    const order = await Order.findOne({ tableNumber });

    // Prepare snack items to be displayed in the order form
    const orderItems = order ? order.items : [];
    res.render('order', { tableNumber, snacks, orderItems });
});

// Place an order for a specific table
app.post('/orders/:tableNumber', async (req, res) => {
    const tableNumber = req.params.tableNumber;

    let items = [];
    let totalAmount = 0;

    // Process each snack item
    for (let snack in req.body.snacks) {
        if (req.body.snacks[snack].checked) {
            const quantity = parseInt(req.body.snacks[snack].quantity, 10) || 0;
            const price = snacks[snack];
            const totalPrice = quantity * price;

            items.push({ snackName: snack, quantity, price, totalPrice });
            totalAmount += totalPrice;
        }
    }

    // Update or create the order for the table
    await Order.findOneAndUpdate(
        { tableNumber },
        { tableNumber, items, totalAmount },
        { upsert: true }
    );

    res.redirect(`/orders/${tableNumber}`);
});

// Reset the order for a specific table
app.post('/orders/:tableNumber/reset', async (req, res) => {
    const tableNumber = req.params.tableNumber;

    // Delete the order for the table
    await Order.deleteOne({ tableNumber });

    res.redirect(`/orders/${tableNumber}`);
});

// Generate a PDF for the table's order
app.get('/orders/:tableNumber/pdf', async (req, res) => {
    const tableNumber = req.params.tableNumber;

    // Fetch the order from the database
    const order = await Order.findOne({ tableNumber });

    if (!order) {
        return res.status(404).send('Order not found');
    }

    // Create a PDF document
    const doc = new pdfkit();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-table-${tableNumber}.pdf`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Get the current date and time
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();

    // Title
    doc.fontSize(40).text(`Joshi Wadewale`, { align: 'center' });
    doc.fontSize(30).text(`Bill receipt`, { align: 'center' });
    doc.moveDown();

    // Add date and time
    doc.fontSize(15).text(`Date: ${formattedDate}`, { align: 'left' });
    doc.fontSize(15).text(`Time: ${formattedTime}`, { align: 'left' });
    doc.moveDown();

    // List all ordered snacks
    doc.fontSize(20).text('Ordered Items:', { underline: true });
    doc.moveDown();
    order.items.forEach(item => {
        doc.text(`${item.snackName} -  ${item.price} x ${item.quantity} =  ${item.totalPrice}`);
    });
    doc.moveDown();

    // Total amount
    doc.fontSize(20).text(`Total Amount: RS ${order.totalAmount}`, { bold: true });
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(20).text(`Thank You, Visit Again!`, { align: 'center' });

    // Finalize the PDF and end the stream
    doc.end();
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
