'use strict';

const pino = require('pino');
const { logLevel, nodeEnv } = require('../config');

const logger = pino({
  level: logLevel,
  ...(nodeEnv !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

module.exports = logger;
