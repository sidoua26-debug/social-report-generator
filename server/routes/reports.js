const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { dbAsync } = require('../db');
const { authenticateToken } = require('./auth');
const { parseInstagramCSV } = require('../services/csvParser');
const { generateExecutiveSummary } = require('../services/aiSummary');

const router = express.Router();

// Setup multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `export-${uniqueSuffix}.csv`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || file.mimetype.includes('csv') || file.mimetype.includes('plain')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files (.csv) are allowed for analytics upload.'));
    }
  }
});

// POST /api/reports/generate - generate report from uploaded CSV or sample
router.post('/generate', authenticateToken, upload.single('csv_file'), async (req, res) => {
  try {
    const clientName = (req.body.client_name || 'Valued Client').trim();
    const useSample = req.body.use_sample === 'true' || req.body.use_sample === true;

    let csvPath = null;
    let originalFilename = '';

    if (useSample) {
      csvPath = path.join(__dirname, '../data/sample_instagram_export.csv');
      originalFilename = 'sample_instagram_export.csv';
    } else if (req.file) {
      csvPath = req.file.path;
      originalFilename = req.file.originalname;
    } else {
      return res.status(400).json({ error: 'Please upload an Instagram analytics CSV export or choose the sample dataset.' });
    }

    // 1. Parse CSV and compute metrics
    let computedMetrics;
    try {
      computedMetrics = await parseInstagramCSV(csvPath);
    } catch (parseErr) {
      // Clean up uploaded file if parsing failed
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({ error: parseErr.message });
    }

    // 2. Generate AI summary
    const summaryText = await generateExecutiveSummary(computedMetrics, clientName);

    // 3. Create unguessable random token for shareable link
    const shareableToken = crypto.randomBytes(16).toString('hex');

    // 4. Save to database - strictly derive period dates from min/max dates in uploaded data
    const periodStart = computedMetrics.period?.start || 'N/A';
    const periodEnd = computedMetrics.period?.end || 'N/A';

    const insertResult = await dbAsync.run(
      `INSERT INTO reports 
       (user_id, client_name, period_start, period_end, raw_csv_filename, computed_metrics, summary_text, shareable_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        clientName,
        periodStart,
        periodEnd,
        originalFilename,
        JSON.stringify(computedMetrics),
        summaryText,
        shareableToken
      ]
    );

    // 5. Retrieve created report with user agency branding
    const createdReport = await dbAsync.get(
      `SELECT r.*, u.agency_name, u.logo_url, u.brand_color
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [insertResult.lastID]
    );

    createdReport.computed_metrics = JSON.parse(createdReport.computed_metrics);

    res.status(201).json({
      message: 'Report generated successfully',
      report: createdReport
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Internal server error generating report: ' + err.message });
  }
});

// GET /api/reports - list all reports for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await dbAsync.all(
      `SELECT id, client_name, period_start, period_end, summary_text, shareable_token, created_at
       FROM reports
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ reports: rows });
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// GET /api/reports/:id - get single report by ID (authenticated)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await dbAsync.get(
      `SELECT r.*, u.agency_name, u.logo_url, u.brand_color
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    report.computed_metrics = JSON.parse(report.computed_metrics);
    res.json({ report });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Failed to retrieve report.' });
  }
});

// DELETE /api/reports/:id - delete report
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbAsync.run(
      'DELETE FROM reports WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found or not authorized.' });
    }

    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

// GET /api/reports/public/:token - public read-only endpoint for clients (no auth needed)
router.get('/public/:token', async (req, res) => {
  try {
    const report = await dbAsync.get(
      `SELECT r.id, r.client_name, r.period_start, r.period_end, r.computed_metrics, r.summary_text, r.shareable_token, r.created_at,
              u.agency_name, u.logo_url, u.brand_color
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.shareable_token = ?`,
      [req.params.token]
    );

    if (!report) {
      return res.status(404).json({ error: 'This report does not exist or the link has expired.' });
    }

    report.computed_metrics = JSON.parse(report.computed_metrics);
    res.json({ report });
  } catch (err) {
    console.error('Public report error:', err);
    res.status(500).json({ error: 'Failed to retrieve public report.' });
  }
});

// GET /api/reports/download/sample-csv
router.get('/download/sample-csv', (req, res) => {
  const samplePath = path.join(__dirname, '../data/sample_instagram_export.csv');
  res.download(samplePath, 'sample_instagram_export.csv');
});

module.exports = router;
