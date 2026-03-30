const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { jwtSecret: secretKey } = require('../config');

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

// Memory storage — convert to base64 data URLs so images persist across serverless invocations
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/upload — returns base64 data URLs stored directly (no filesystem)
router.post('/upload', authenticate, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const urls = req.files.map((f) => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
  res.json({ urls });
});

module.exports = router;
