'use strict';

// Load env vars — needed to resolve MONGODB_URL
require('dotenv').config();

const config = {
  mongodb: {
    // Uses the same MONGODB_URL as the app
    url: process.env.MONGODB_URL,

    // Target database is part of the connection string; set here as fallback
    databaseName: 'carRental',

    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Directory that contains the migration scripts
  migrationsDir: 'migrations',

  // Collection that stores which migrations have already been applied
  changelogCollectionName: 'changelog',

  // File extension for generated migration files
  migrationFileExtension: '.js',

  // Enable the algorithm to create a checksum of the file contents and use that
  // in the changelog. This algorithm is not yet production-ready.
  useFileHash: false,

  // Module system to use. Default is 'commonjs'
  moduleSystem: 'commonjs',
};

module.exports = config;
