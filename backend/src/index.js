const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { analyzeImage } = require('./services/ocrService');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Ensure required directories exist ────────────────────────────────────────
const dbDir = path.join(__dirname, 'database');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dbDir, 'database.sqlite');

// ── Auto-initialize DB if tables don't exist ─────────────────────────────────
const db = new sqlite3.Database(dbPath);

const initDB = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL, password_hash TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, brand TEXT, category TEXT, image_url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER, user_id INTEGER, date TEXT,
      status TEXT, score INTEGER, image_url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS extracted_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER, field_name TEXT, value TEXT,
      confidence INTEGER, is_valid BOOLEAN
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER, rule_id TEXT, severity TEXT,
      description TEXT, status TEXT DEFAULT 'Open', date TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      description TEXT, severity TEXT, is_enabled BOOLEAN DEFAULT 1
    )`);

    // Seed only if empty
    db.get('SELECT COUNT(*) as c FROM users', (err, row) => {
      if (err || row.c > 0) return;

      db.run(`INSERT OR IGNORE INTO users (name, email, role, password_hash) VALUES ('Officer Demo','demo@metrocheck.gov','officer','hashed_pass')`);

      const rules = [
        ['LM-001','Manufacturer / Packer','Mandatory declaration of identity','HIGH',1],
        ['LM-002','Net Quantity','Mandatory declaration of net weight','HIGH',1],
        ['LM-003','MRP','Mandatory declaration of Maximum Retail Price','HIGH',1],
        ['LM-004','Consumer Care','Contact details for consumer complaints','MEDIUM',1],
        ['LM-005','Date of Manufacture','Month and Year of packing/manufacture','HIGH',1],
        ['LM-006','Readability','Font size and clear contrast','LOW',1],
      ];
      const rStmt = db.prepare('INSERT OR IGNORE INTO rules (id,name,description,severity,is_enabled) VALUES (?,?,?,?,?)');
      rules.forEach(r => rStmt.run(r));
      rStmt.finalize();

      const products = [
        ['Premium Basmati Rice','IndiaGate','Food'],
        ['Chocolate Chip Biscuits','Parle','Food'],
        ['Refined Sunflower Oil','Fortune','Food'],
        ['Anti-Dandruff Shampoo','Head & Shoulders','Cosmetics'],
        ['Washing Powder','Tide','Household'],
      ];
      const pStmt = db.prepare('INSERT OR IGNORE INTO products (name,brand,category) VALUES (?,?,?)');
      products.forEach(p => pStmt.run(p));
      pStmt.finalize();

      const now = new Date().toISOString();
      const day1 = new Date(Date.now() - 86400000).toISOString();
      const day2 = new Date(Date.now() - 172800000).toISOString();
      db.run(`INSERT INTO inspections (product_id,user_id,date,status,score) VALUES (1,1,'${now}','COMPLIANT',96)`);
      db.run(`INSERT INTO inspections (product_id,user_id,date,status,score) VALUES (2,1,'${day1}','WARNING',81)`);
      db.run(`INSERT INTO inspections (product_id,user_id,date,status,score) VALUES (3,1,'${day2}','NON-COMPLIANT',54)`);

      db.get('SELECT id FROM inspections WHERE status="WARNING" LIMIT 1', (e, r) => {
        if (r) db.run(`INSERT INTO violations (inspection_id,rule_id,severity,description,status,date) VALUES (${r.id},'LM-006','LOW','Potential font size issue - requires officer verification','Open','${day1}')`);
      });
      db.get('SELECT id FROM inspections WHERE status="NON-COMPLIANT" LIMIT 1', (e, r) => {
        if (r) {
          db.run(`INSERT INTO violations (inspection_id,rule_id,severity,description,status,date) VALUES (${r.id},'LM-003','HIGH','Missing MRP','Open','${day2}')`);
          db.run(`INSERT INTO violations (inspection_id,rule_id,severity,description,status,date) VALUES (${r.id},'LM-004','MEDIUM','Missing Consumer Care Details','Open','${day2}')`);
        }
      });

      console.log('[DB] Seed data inserted.');
    });
  });
};

initDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// ── Health check (for Railway / Render uptime) ────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', service: 'Metro-Check AI Backend', version: '2.0' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// ── API Routes ────────────────────────────────────────────────────────────────

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as total FROM inspections', (err, row) => {
    stats.totalInspections = row?.total || 0;
    db.get("SELECT COUNT(*) as total FROM inspections WHERE status='COMPLIANT'", (err, row) => {
      stats.compliant = row?.total || 0;
      db.get('SELECT COUNT(*) as total FROM violations', (err, row) => {
        stats.violations = row?.total || 0;
        db.get("SELECT COUNT(*) as total FROM inspections WHERE status='WARNING'", (err, row) => {
          stats.pendingReview = row?.total || 0;
          stats.complianceRate = stats.totalInspections > 0
            ? ((stats.compliant / stats.totalInspections) * 100).toFixed(1)
            : 0;
          res.json(stats);
        });
      });
    });
  });
});

// Products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Rules
app.get('/api/rules', (req, res) => {
  db.all('SELECT * FROM rules', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/rules/:id', (req, res) => {
  const { is_enabled } = req.body;
  db.run('UPDATE rules SET is_enabled=? WHERE id=?', [is_enabled ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Rule updated', changes: this.changes });
  });
});

// Inspections list
app.get('/api/inspections', (req, res) => {
  const query = `
    SELECT i.*, p.name as product_name, p.brand as product_brand, u.name as inspector_name
    FROM inspections i
    LEFT JOIN products p ON i.product_id = p.id
    LEFT JOIN users u ON i.user_id = u.id
    ORDER BY i.date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Analyze image
app.post('/api/inspections/analyze', upload.single('image'), async (req, res) => {
  try {
    const { useDemoData, demoType } = req.body;
    let imageUrl = null;
    let imagePath = null;

    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
      imagePath = req.file.path;
    }

    const result = await analyzeImage(imagePath, useDemoData === 'true', demoType, db);
    res.json({ success: true, imageUrl, ...result });
  } catch (error) {
    console.error('[Analyze Error]', error);
    res.status(500).json({ error: 'Failed to process image', detail: error.message });
  }
});

// Save inspection
app.post('/api/inspections', (req, res) => {
  const { product_id, user_id, date, status, score, image_url, declarations, violations } = req.body;
  db.run(
    `INSERT INTO inspections (product_id,user_id,date,status,score,image_url) VALUES (?,?,?,?,?,?)`,
    [product_id, user_id, date, status, score, image_url],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const inspectionId = this.lastID;

      if (declarations?.length > 0) {
        const stmt = db.prepare('INSERT INTO extracted_declarations (inspection_id,field_name,value,confidence,is_valid) VALUES (?,?,?,?,?)');
        declarations.forEach(d => stmt.run(inspectionId, d.field_name, d.value, d.confidence, d.is_valid ? 1 : 0));
        stmt.finalize();
      }
      if (violations?.length > 0) {
        const stmt = db.prepare('INSERT INTO violations (inspection_id,rule_id,severity,description,date) VALUES (?,?,?,?,?)');
        violations.forEach(v => stmt.run(inspectionId, v.rule_id, v.severity, v.description, date));
        stmt.finalize();
      }

      res.json({ success: true, id: inspectionId });
    }
  );
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Metro-Check] Backend running on port ${PORT}`);
});
