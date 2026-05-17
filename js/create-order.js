const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { items } = req.body;
    const productsPath = path.join(process.cwd(), 'data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    
    let subtotal = 0;
    items.forEach(item => {
      const p = products.find(x => x.id === item.id);
      if (p) subtotal += p.price * item.qty;
    });
    
    const ship = subtotal >= 1499 ? 0 : 99;
    const total = subtotal + ship;
    
    const order = await razorpay.orders.create({
      amount: total * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });
    
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};