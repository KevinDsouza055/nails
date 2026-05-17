const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Razorpay with environment variables for security
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Use __dirname to navigate from /js to /data/products.json reliably in serverless environments
const productsPath = path.join(__dirname, '..', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

app.post('/create-order', async (req, res) => {
  try {
    const { items } = req.body;
    let subtotal = 0;

    // SECURE: Calculate total based on server-side product data
    items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        subtotal += product.price * item.qty;
      }
    });

    const shipping = subtotal >= 1499 ? 0 : 99;
    const totalAmount = (subtotal + shipping) * 100; // Razorpay expects amount in paise

    const order = await razorpay.orders.create({
      amount: totalAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;