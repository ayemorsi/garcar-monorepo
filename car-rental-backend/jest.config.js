'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // env.js runs BEFORE any module is imported — sets required env vars
  setupFiles: ['./tests/env.js'],
  // setup.js runs AFTER the test framework — uses beforeAll/afterAll
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  // No real MongoDB connection — forceExit prevents hanging open handles
  forceExit: true,
};
