'use strict';

// Load .env file in non-production environments
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error(
    '[config] JWT_SECRET environment variable is not set.\n' +
    'Copy .env.example to .env and fill in a strong random secret.'
  );
}

if (!process.env.MONGODB_URL) {
  throw new Error(
    '[config] MONGODB_URL environment variable is not set.\n' +
    'Copy .env.example to .env and set your MongoDB connection string.'
  );
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  mongoUrl: process.env.MONGODB_URL,
  port: parseInt(process.env.PORT || '5001', 10),
};
