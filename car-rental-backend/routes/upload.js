const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const router = express.Router();
const secretKey = 'your_secret_key';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const storage = multer.diskStorage({
  destination: '/tmp/uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/upload — upload up to 10 images, returns array of URLs
router.post('/upload', authenticate, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const baseUrl = process.env.BACKEND_URL || '';
  const urls = req.files.map((f) => `${baseUrl}/uploads/${f.filename}`);
  res.json({ urls });
});

module.exports = router;
