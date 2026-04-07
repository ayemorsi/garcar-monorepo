'use strict';

/**
 * Migration: add-booking-status-index
 *
 * The availability check in POST /api/bookings and GET /api/cars queries
 * bookings by { status, startDate, endDate }. A compound index on these
 * three fields speeds up that query significantly.
 */

module.exports = {
  async up(db) {
    await db.collection('bookings').createIndex(
      { status: 1, startDate: 1, endDate: 1 },
      { background: true }
    );
    // Also index by owner and renter for the dashboard queries
    await db.collection('bookings').createIndex({ ownerId: 1, createdAt: -1 }, { background: true });
    await db.collection('bookings').createIndex({ renterId: 1, startDate: -1 }, { background: true });
  },

  async down(db) {
    await db.collection('bookings').dropIndex('status_1_startDate_1_endDate_1');
    await db.collection('bookings').dropIndex('ownerId_1_createdAt_-1');
    await db.collection('bookings').dropIndex('renterId_1_startDate_-1');
  },
};
