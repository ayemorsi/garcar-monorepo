'use strict';

/**
 * Migration: add-notification-indexes
 *
 * GET /api/notifications queries by userId + read status, and counts
 * unread notifications. An index on (userId, read) covers both queries.
 * Messages are queried by senderId/receiverId pairs.
 */

module.exports = {
  async up(db) {
    await db.collection('notifications').createIndex(
      { userId: 1, read: 1, createdAt: -1 },
      { background: true }
    );
    await db.collection('messages').createIndex(
      { senderId: 1, receiverId: 1, createdAt: 1 },
      { background: true }
    );
  },

  async down(db) {
    await db.collection('notifications').dropIndex('userId_1_read_1_createdAt_-1');
    await db.collection('messages').dropIndex('senderId_1_receiverId_1_createdAt_1');
  },
};
