const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- IMAGE UPLOAD SETUP ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); 
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, cleanName);
  }
});
const upload = multer({ storage: storage });

// --- PRODUCT ROUTES ---
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.post('/api/products/upload', upload.single('image'), (req, res) => {
    const { name, price, category, color, size, stock } = req.body;
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const imagePath = `/images/${req.file.filename}`;
    try {
        db.prepare('INSERT INTO products (name, price, category, image, color, size, stock) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, price, category, imagePath, color, size, stock);
        res.json({ success: true, message: 'Product uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to save product' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.put('/api/products/:id', (req, res) => {
    const { price } = req.body;
    try {
        db.prepare('UPDATE products SET price = ? WHERE id = ?').run(price, req.params.id);
        res.json({ success: true, message: 'Price updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update price' });
    }
});

// --- CART ROUTES ---
app.get('/api/cart', (req, res) => {
    try {
        const cartItems = db.prepare('SELECT * FROM cart').all();
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load cart' });
    }
});

app.post('/api/cart', (req, res) => {
    const { product_name, color, size, price, image } = req.body;
    try {
        const existingItem = db.prepare('SELECT * FROM cart WHERE product_name = ? AND color = ? AND size = ?').get(product_name, color, size);
        if (existingItem) {
            db.prepare('UPDATE cart SET quantity = quantity + 1 WHERE id = ?').run(existingItem.id);
        } else {
            db.prepare('INSERT INTO cart (product_name, color, size, price, image, quantity) VALUES (?, ?, ?, ?, ?, 1)').run(product_name, color, size, price, image);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

app.delete('/api/cart/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

app.delete('/api/cart/clear', (req, res) => {
    try {
        db.prepare('DELETE FROM cart').run();
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// --- ADMIN STATS ROUTE ---
app.get('/api/admin/stats', (req, res) => {
    try {
        const totalProducts = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
        const totalOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
        const revenueResult = db.prepare('SELECT SUM(total_price) AS total FROM orders').get();
        const totalRevenue = revenueResult.total || 0;
        const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();

        res.json({ totalProducts, totalOrders, totalRevenue, recentOrders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

// --- CHECKOUT ROUTE ---
app.post('/api/checkout', (req, res) => {
    const { customer_name, total } = req.body;
    const date = new Date().toISOString();

    try {
        // 1. Save the order to the database
        db.prepare('INSERT INTO orders (customer_name, total_price, order_date) VALUES (?, ?, ?)').run(customer_name, total, date);
        
        // 2. Clear the cart
        db.prepare('DELETE FROM cart').run();
        
        res.json({ success: true, message: 'Order placed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Checkout failed' });
    }
});
// --- AUTHENTICATION ROUTES ---

// Register a new user
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
        res.json({ success: true, message: 'Account created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login a user
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// --- START THE SERVER ---
app.delete('/api/cart/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// --- ADMIN CUSTOMERS ROUTE ---
app.get('/api/admin/customers', (req, res) => {
    try {
        const customers = db.prepare('SELECT customer_name, COUNT(*) as total_orders, SUM(total_price) as total_spent FROM orders GROUP BY customer_name').all();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load customers' });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🔥 THE INFINITES CLOTHING server is running!`);
  console.log(`👉 Open your browser and go to: http://localhost:${PORT}\n`);
});