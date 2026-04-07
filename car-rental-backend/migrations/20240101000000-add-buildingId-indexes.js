'use strict';

/**
 * Migration: add-buildingId-indexes
 *
 * Cars and users are scoped to a building. Adding indexes on buildingId
 * makes the per-building filter used in GET /api/cars and all admin
 * user lookups significantly faster as the dataset grows.
 */

module.exports = {
  async up(db) {
    await db.collection('users').createIndex({ buildingId: 1 }, { background: true });
    await db.collection('cars').createIndex({ buildingId: 1 }, { background: true });
  },

  async down(db) {
    await db.collection('users').dropIndex('buildingId_1');
    await db.collection('cars').dropIndex('buildingId_1');
  },
};
