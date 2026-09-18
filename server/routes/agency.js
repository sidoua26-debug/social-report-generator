const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbAsync } = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Setup multer for logo uploads
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
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, SVG, WebP) are allowed for logo uploads.'));
    }
  }
});

// PUT /api/agency/branding - update agency name & color
router.put('/branding', authenticateToken, async (req, res) => {
  try {
    const { agency_name, brand_color } = req.body;

    await dbAsync.run(
      'UPDATE users SET agency_name = COALESCE(?, agency_name), brand_color = COALESCE(?, brand_color) WHERE id = ?',
      [agency_name?.trim(), brand_color?.trim(), req.user.id]
    );

    const updatedUser = await dbAsync.get(
      'SELECT id, email, agency_name, logo_url, brand_color, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Agency branding updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Update branding error:', err);
    res.status(500).json({ error: 'Server error updating branding.' });
  }
});

// POST /api/agency/logo - upload logo image
router.post('/logo', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    await dbAsync.run(
      'UPDATE users SET logo_url = ? WHERE id = ?',
      [logoUrl, req.user.id]
    );

    const updatedUser = await dbAsync.get(
      'SELECT id, email, agency_name, logo_url, brand_color, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Logo uploaded successfully', logo_url: logoUrl, user: updatedUser });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ error: err.message || 'Server error uploading logo.' });
  }
});

module.exports = router;
