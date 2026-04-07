'use strict';

// ── Phase 1: Environment variables ───────────────────────────────────────────
// This file runs via Jest's `setupFiles` BEFORE any test framework or
// test file is loaded. Set all required env vars here.

process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MONGODB_URL = 'mongodb://127.0.0.1:27017/garcar_jest_placeholder';
process.env.FRONTEND_URL = 'http://localhost:3000';

// ── Phase 2: Prevent real MongoDB connections ────────────────────────────────
// server.js calls connectDB() on every request. Intercept mongoose.connect
// before it's ever called so tests never try to open a real socket.
const mongoose = require('mongoose');

const origConnect = mongoose.connect;
mongoose.connect = async function (...args) {
  // After "connecting", fake readyState = 1 so connectDB()'s early-return
  // guard passes on subsequent middleware invocations.
  Object.defineProperty(mongoose.connection, 'readyState', {
    get: () => 1,
    configurable: true,
    enumerable: true,
  });
  // Also set the module-level dbConnected flag inside server.js.
  // We can't access it directly, but once readyState is 1 the next call
  // to connectDB() will check dbConnected (which gets set to true after
  // the first successful connect) and return early.
};
