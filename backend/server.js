const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const subscribeRouter = require('./routes/subscribe');
const contactRouter = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/contact', contactRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KAT Life API is running' });
});

app.listen(PORT, () => {
  console.log(`KAT Life backend running on http://localhost:${PORT}`);
});
