const express = require('express');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const router = express.Router();

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      req.user = decoded;
      next();
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// GET /api/conversations — list all conversation partners with latest message and unread count
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const conversationMap = {};

    for (const msg of messages) {
      const otherUserId =
        msg.senderId.toString() === userId
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!conversationMap[otherUserId]) {
        conversationMap[otherUserId] = {
          otherUserId,
          latestMessage: msg,
          unreadCount: 0,
        };
      }

      if (!msg.read && msg.receiverId.toString() === userId) {
        conversationMap[otherUserId].unreadCount += 1;
      }
    }

    const otherUserIds = Object.keys(conversationMap);
    const users = await User.find({ _id: { $in: otherUserIds } }).select(
      'firstName lastName username avatar'
    );

    const userMap = {};
    for (const u of users) {
      userMap[u._id.toString()] = u;
    }

    const conversations = otherUserIds.map((id) => ({
      user: userMap[id] || null,
      latestMessage: conversationMap[id].latestMessage,
      unreadCount: conversationMap[id].unreadCount,
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// GET /api/messages/:otherUserId — get all messages between current user and another user
router.get('/messages/:otherUserId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const otherUserId = req.params.otherUserId;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, read: false },
      { $set: { read: true } }
    );

    res.json(messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// POST /api/messages — send a message
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { toUserId, content, bookingId } = req.body;
    const message = new Message({
      senderId: req.user.userId,
      receiverId: toUserId,
      content,
      bookingId: bookingId || undefined,
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

module.exports = router;
