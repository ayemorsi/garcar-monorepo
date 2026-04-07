'use strict';

// ── Phase 3: Model-level stubs needed before any request fires ────────────────
// Building.countDocuments is called in connectDB() to seed default buildings.
// Return 1 so the seed block is skipped.

const Building = require('../models/Building');
const User = require('../models/User');

// A mock query object returned by chainable mongoose queries
function mockQuery(value) {
  const q = { exec: jest.fn().mockResolvedValue(value) };
  q.select = jest.fn().mockResolvedValue(value);
  return q;
}

beforeAll(() => {
  jest
    .spyOn(Building, 'countDocuments')
    .mockResolvedValue(1);

  // server.js fires `User.findByIdAndUpdate(userId, {lastSeen}).exec()` on every
  // authenticated request without awaiting the result. Mock it to avoid the
  // "buffering timed out" error that occurs without a real MongoDB connection.
  jest
    .spyOn(User, 'findByIdAndUpdate')
    .mockReturnValue(mockQuery(null));
});

afterAll(() => {
  jest.restoreAllMocks();
});

afterEach(() => {
  // Clear all mock call history between tests so assertions stay clean,
  // but keep the implementations (restoreAllMocks is only in afterAll).
  jest.clearAllMocks();
});
