const express = require('express');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

const router = express.Router();
const { jwtSecret: secretKey } = require('../config');
const logger = require('../lib/logger');

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

// GET /api/notifications — get notifications for current user
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user.userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    logger.error({ err }, 'Error fetching notifications');
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
