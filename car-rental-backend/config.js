'use strict';

// Load .env file in non-production environments
require('dotenv').config();

const { z } = require('zod');

const schema = z.object({
  JWT_SECRET:   z.string().min(1, 'JWT_SECRET is required — copy .env.example to .env and fill in a strong random secret'),
  MONGODB_URL:  z.string().min(1, 'MONGODB_URL is required — set your MongoDB connection string (mongodb:// or mongodb+srv://) in .env'),
  PORT:         z.coerce.number().int().positive().default(5001),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  LOG_LEVEL:    z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  const messages = Object.entries(errors)
    .map(([field, msgs]) => `  ${field}: ${msgs.join(', ')}`)
    .join('\n');
  console.error(`\n[config] Invalid environment variables:\n${messages}\n`);
  process.exit(1);
}

const env = result.data;

module.exports = {
  jwtSecret:   env.JWT_SECRET,
  mongoUrl:    env.MONGODB_URL,
  port:        env.PORT,
  nodeEnv:     env.NODE_ENV,
  frontendUrl: env.FRONTEND_URL,
  logLevel:    env.LOG_LEVEL,
};
