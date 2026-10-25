const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || '/app/data/loan_tool.db';

// Ensure data dir exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  console.log(`Connected to SQLite database at: ${DB_PATH}`);
} catch (err) {
  console.error('Failed to open SQLite database:', err);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// Admin API Endpoints
// -------------------------------------------------------------

// Stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const presets = db.prepare('SELECT count(*) as count FROM loan_presets').get().count;
    const saved = db.prepare('SELECT count(*) as count FROM saved_calculations').get().count;
    const settings = db.prepare('SELECT count(*) as count FROM site_settings').get().count;
    const dbStats = fs.statSync(DB_PATH);

    res.json({
      success: true,
      stats: {
        presets,
        saved,
        settings,
        dbSizeKb: Math.round(dbStats.size / 1024),
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        dbPath: DB_PATH,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Settings (Site Look & Feel)
app.get('/api/admin/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM site_settings').all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    const settings = req.body;
    const now = new Date().toISOString();
    const stmt = db.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)');
    const tx = db.transaction((data) => {
      for (const [k, v] of Object.entries(data)) {
        stmt.run(k, String(v), now);
      }
    });
    tx(settings);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Presets (Loan Configurations)
app.get('/api/admin/presets', (req, res) => {
  try {
    const presets = db.prepare('SELECT * FROM loan_presets ORDER BY id').all();
    res.json({ success: true, presets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/presets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const stmt = db.prepare(`
      UPDATE loan_presets SET
        name = ?,
        default_amount = ?,
        min_amount = ?,
        max_amount = ?,
        step_amount = ?,
        default_rate = ?,
        min_rate = ?,
        max_rate = ?,
        step_rate = ?,
        default_tenure_years = ?,
        min_tenure_years = ?,
        max_tenure_years = ?,
        default_processing_fee_percent = ?,
        default_down_payment_percent = ?,
        description = ?
      WHERE id = ?
    `);

    stmt.run(
      p.name,
      Number(p.default_amount),
      Number(p.min_amount),
      Number(p.max_amount),
      Number(p.step_amount),
      Number(p.default_rate),
      Number(p.min_rate),
      Number(p.max_rate),
      Number(p.step_rate),
      Number(p.default_tenure_years),
      Number(p.min_tenure_years),
      Number(p.max_tenure_years),
      Number(p.default_processing_fee_percent),
      Number(p.default_down_payment_percent),
      p.description,
      id
    );

    res.json({ success: true, message: 'Preset updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/presets', (req, res) => {
  try {
    const p = req.body;
    const id = p.id || `preset_${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO loan_presets (
        id, type, name, default_amount, min_amount, max_amount, step_amount,
        default_rate, min_rate, max_rate, step_rate,
        default_tenure_years, min_tenure_years, max_tenure_years,
        default_processing_fee_percent, default_down_payment_percent, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      p.type || 'home',
      p.name,
      Number(p.default_amount || 1000000),
      Number(p.min_amount || 10000),
      Number(p.max_amount || 50000000),
      Number(p.step_amount || 10000),
      Number(p.default_rate || 8.5),
      Number(p.min_rate || 5.0),
      Number(p.max_rate || 20.0),
      Number(p.step_rate || 0.1),
      Number(p.default_tenure_years || 10),
      Number(p.min_tenure_years || 1),
      Number(p.max_tenure_years || 30),
      Number(p.default_processing_fee_percent || 0.5),
      Number(p.default_down_payment_percent || 20),
      p.description || ''
    );

    res.json({ success: true, message: 'Preset created', id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/presets/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM loan_presets WHERE id = ?').run(id);
    res.json({ success: true, message: 'Preset deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Saved User Calculations
app.get('/api/admin/saved', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM saved_calculations ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, calculations: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/saved/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM saved_calculations WHERE id = ? OR share_code = ?').run(id, id);
    res.json({ success: true, message: 'Calculation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Raw SQL Console
app.post('/api/admin/sql', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query is required' });

    const trimmed = query.trim();
    if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
      const rows = db.prepare(trimmed).all();
      res.json({ success: true, rows, count: rows.length });
    } else {
      const result = db.prepare(trimmed).run();
      res.json({ success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Serve Admin Dashboard HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🛡️  LoanPro Admin Panel running at http://localhost:${PORT}`);
});
