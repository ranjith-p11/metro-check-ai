const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');

// Remove existing database to ensure fresh demo data on every setup run
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL,
          password_hash TEXT NOT NULL
        )
      `);

      // 2. Products table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          brand TEXT,
          category TEXT,
          image_url TEXT
        )
      `);

      // 3. Inspections table
      db.run(`
        CREATE TABLE IF NOT EXISTS inspections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER,
          user_id INTEGER,
          date TEXT,
          status TEXT,
          score INTEGER,
          image_url TEXT,
          FOREIGN KEY (product_id) REFERENCES products(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // 4. Extracted declarations
      db.run(`
        CREATE TABLE IF NOT EXISTS extracted_declarations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inspection_id INTEGER,
          field_name TEXT,
          value TEXT,
          confidence INTEGER,
          is_valid BOOLEAN,
          FOREIGN KEY (inspection_id) REFERENCES inspections(id)
        )
      `);

      // 5. Violations
      db.run(`
        CREATE TABLE IF NOT EXISTS violations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inspection_id INTEGER,
          rule_id TEXT,
          severity TEXT,
          description TEXT,
          status TEXT DEFAULT 'Open',
          date TEXT,
          FOREIGN KEY (inspection_id) REFERENCES inspections(id)
        )
      `);

      // 6. Rules
      db.run(`
        CREATE TABLE IF NOT EXISTS rules (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          severity TEXT,
          is_enabled BOOLEAN DEFAULT 1
        )
      `);

      // Insert Seed Data
      const insertUser = db.prepare(`INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)`);
      insertUser.run('Officer Demo', 'demo@metrocheck.gov', 'officer', 'hashed_pass');
      insertUser.finalize();

      const insertRule = db.prepare(`INSERT INTO rules (id, name, description, severity, is_enabled) VALUES (?, ?, ?, ?, ?)`);
      const defaultRules = [
        ['LM-001', 'Manufacturer / Packer', 'Mandatory declaration of identity', 'HIGH', 1],
        ['LM-002', 'Net Quantity', 'Mandatory declaration of net weight', 'HIGH', 1],
        ['LM-003', 'MRP', 'Mandatory declaration of Maximum Retail Price', 'HIGH', 1],
        ['LM-004', 'Consumer Care', 'Contact details for consumer complaints', 'MEDIUM', 1],
        ['LM-005', 'Date of Manufacture', 'Month and Year of packing/manufacture', 'HIGH', 1],
        ['LM-006', 'Readability', 'Font size and clear contrast', 'LOW', 1],
      ];
      defaultRules.forEach(r => insertRule.run(r));
      insertRule.finalize();

      const insertProduct = db.prepare(`INSERT INTO products (name, brand, category) VALUES (?, ?, ?)`);
      const defaultProducts = [
        ['Premium Basmati Rice', 'IndiaGate', 'Food'],
        ['Chocolate Chip Biscuits', 'Parle', 'Food'],
        ['Refined Sunflower Oil', 'Fortune', 'Food'],
        ['Anti-Dandruff Shampoo', 'Head & Shoulders', 'Cosmetics'],
        ['Washing Powder', 'Tide', 'Household']
      ];
      defaultProducts.forEach(p => insertProduct.run(p));
      insertProduct.finalize();

      // Insert some mock inspections and violations for Demo
      const insertInspection = db.prepare(`INSERT INTO inspections (product_id, user_id, date, status, score) VALUES (?, ?, ?, ?, ?)`);
      insertInspection.run(1, 1, new Date().toISOString(), 'COMPLIANT', 96);
      insertInspection.run(2, 1, new Date(Date.now() - 86400000).toISOString(), 'WARNING', 81);
      insertInspection.run(3, 1, new Date(Date.now() - 172800000).toISOString(), 'NON-COMPLIANT', 54);
      insertInspection.finalize();
      
      const insertViolation = db.prepare(`INSERT INTO violations (inspection_id, rule_id, severity, description, status, date) VALUES (?, ?, ?, ?, ?, ?)`);
      insertViolation.run(2, 'LM-006', 'LOW', 'Potential font size issue - requires officer verification', 'Open', new Date(Date.now() - 86400000).toISOString());
      insertViolation.run(3, 'LM-003', 'HIGH', 'Missing MRP', 'Open', new Date(Date.now() - 172800000).toISOString());
      insertViolation.run(3, 'LM-004', 'MEDIUM', 'Missing Consumer Care Details', 'Open', new Date(Date.now() - 172800000).toISOString());
      insertViolation.finalize();

      console.log('Database setup complete with seed data.');
      resolve(db);
    });
  });
};

if (require.main === module) {
  setupDatabase().then(() => {
    db.close();
  });
}

module.exports = { db, setupDatabase };
