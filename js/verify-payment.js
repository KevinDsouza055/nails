const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { order_id, payment_id, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  const body = order_id + "|" + payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
    
  if (expectedSignature === signature) {
    res.status(200).json({ status: 'ok' });
  } else {
    res.status(400).json({ status: 'error' });
  }
};