const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { analyzeImage } = require('./services/ocrService');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes

// 1. Dashboard Stats
app.get('/api/dashboard', (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as total FROM inspections', (err, row) => {
    stats.totalInspections = row.total;
    db.get("SELECT COUNT(*) as total FROM inspections WHERE status = 'COMPLIANT'", (err, row) => {
      stats.compliant = row.total;
      db.get('SELECT COUNT(*) as total FROM violations', (err, row) => {
        stats.violations = row.total;
        db.get("SELECT COUNT(*) as total FROM inspections WHERE status = 'WARNING'", (err, row) => {
          stats.pendingReview = row.total;
          stats.complianceRate = stats.totalInspections > 0 ? ((stats.compliant / stats.totalInspections) * 100).toFixed(1) : 0;
          res.json(stats);
        });
      });
    });
  });
});

// 2. Products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. Rules
app.get('/api/rules', (req, res) => {
  db.all('SELECT * FROM rules', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/rules/:id', (req, res) => {
  const { is_enabled } = req.body;
  db.run('UPDATE rules SET is_enabled = ? WHERE id = ?', [is_enabled ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Rule updated', changes: this.changes });
  });
});

// 4. Inspections
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

    // Call OCR/Compliance engine
    const result = await analyzeImage(imagePath, useDemoData === 'true', demoType, db);
    
    // In a real app we'd save to DB here if it's not just a dry run
    res.json({
      success: true,
      imageUrl,
      ...result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.post('/api/inspections', (req, res) => {
    const { product_id, user_id, date, status, score, image_url, declarations, violations } = req.body;
    
    db.run(`INSERT INTO inspections (product_id, user_id, date, status, score, image_url) VALUES (?, ?, ?, ?, ?, ?)`, 
        [product_id, user_id, date, status, score, image_url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const inspectionId = this.lastID;

        // Insert declarations
        if (declarations && declarations.length > 0) {
            const stmt = db.prepare('INSERT INTO extracted_declarations (inspection_id, field_name, value, confidence, is_valid) VALUES (?, ?, ?, ?, ?)');
            declarations.forEach(d => {
                stmt.run(inspectionId, d.field_name, d.value, d.confidence, d.is_valid ? 1 : 0);
            });
            stmt.finalize();
        }

        // Insert violations
        if (violations && violations.length > 0) {
            const stmt = db.prepare('INSERT INTO violations (inspection_id, rule_id, severity, description, date) VALUES (?, ?, ?, ?, ?)');
            violations.forEach(v => {
                stmt.run(inspectionId, v.rule_id, v.severity, v.description, date);
            });
            stmt.finalize();
        }

        res.json({ success: true, id: inspectionId });
    });
});


// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
