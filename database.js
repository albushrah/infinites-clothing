const Database = require('better-sqlite3');
const db = new Database('infinites.db'); 

// 1. Create Products Table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    category TEXT,
    image TEXT,
    color TEXT,
    size TEXT,
    stock INTEGER
  );
`);

// 2. Create Cart Table
db.exec(`
  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    color TEXT,
    size TEXT,
    price REAL,
    image TEXT,
    quantity INTEGER
  );
`);

// 3. Create Orders Table (For when they actually pay)
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    total_price REAL,
    order_date TEXT
  );
`);

// 4. Seed the database with products if it's empty
const count = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;

if (count === 0) {
  const insert = db.prepare('INSERT INTO products (name, price, category, image, color, size, stock) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  const teeColors = ['Ink Black', 'Charcoal', 'Bone', 'Steel Grey'];
  teeColors.forEach(color => {
    const imgName = `/images/tee-${color.toLowerCase().replace(' ', '-')}.jpg`;
    insert.run('Essential Tee', 15000, 'Tees', imgName, color, 'M', 10);
    insert.run('Essential Tee', 15000, 'Tees', imgName, color, 'L', 10);
    insert.run('Essential Tee', 15000, 'Tees', imgName, color, 'XL', 5);
  });
  
  const hoodieColors = ['Ink Black', 'Charcoal', 'Bone', 'Steel Grey'];
  hoodieColors.forEach(color => {
    const imgName = `/images/hoodie-${color.toLowerCase().replace(' ', '-')}.jpg`;
    insert.run('Washed Hoodie', 45000, 'Hoodies', imgName, color, 'M', 8);
    insert.run('Washed Hoodie', 45000, 'Hoodies', imgName, color, 'L', 8);
    insert.run('Washed Hoodie', 45000, 'Hoodies', imgName, color, 'XL', 4);
  });

  const cargoColors = ['Ink Black', 'Charcoal', 'Bone', 'Steel Grey'];
  cargoColors.forEach(color => {
    const imgName = `/images/cargo-${color.toLowerCase().replace(' ', '-')}.jpg`;
    insert.run('Utility Cargo Pants', 35000, 'Bottoms', imgName, color, '32', 5);
    insert.run('Utility Cargo Pants', 35000, 'Bottoms', imgName, color, '34', 5);
    insert.run('Utility Cargo Pants', 35000, 'Bottoms', imgName, color, '36', 3);
  });

  const jacketColors = ['Ink Black', 'Charcoal', 'Bone', 'Steel Grey'];
  jacketColors.forEach(color => {
    const imgName = `/images/jacket-${color.toLowerCase().replace(' ', '-')}.jpg`;
    insert.run('Tech Windbreaker', 55000, 'Outerwear', imgName, color, 'M', 5);
    insert.run('Tech Windbreaker', 55000, 'Outerwear', imgName, color, 'L', 5);
    insert.run('Tech Windbreaker', 55000, 'Outerwear', imgName, color, 'XL', 2);
  });
  
  console.log('NOIRFRAME products added to the database successfully!');
}
// 4. Create Users Table (For Accounts)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  );
`);
// 5. Export the database
module.exports = db;