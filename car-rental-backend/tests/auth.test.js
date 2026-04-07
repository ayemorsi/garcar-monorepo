'use strict';

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = require('../server');
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');
const Building = require('../models/Building');

const SECRET = process.env.JWT_SECRET;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    password: '$2b$10$fakehash',
    isVerified: true,
    approved: true,
    role: 'user',
    paused: false,
    firstName: 'Test',
    lastName: 'User',
    toObject: function () { return { ...this }; },
    select: function () { return this; },
    ...overrides,
  };
}

function makeSettings(overrides = {}) {
  return { registrationOpen: true, requireApproval: true, ...overrides };
}

// ── POST /api/register ────────────────────────────────────────────────────────

describe('POST /api/register', () => {
  beforeEach(() => {
    jest.spyOn(AppSettings, 'findOne').mockResolvedValue(makeSettings());
    jest.spyOn(User, 'findOne').mockResolvedValue(null); // no existing user
    jest.spyOn(User.prototype, 'save').mockResolvedValue(undefined);
  });

  it('registers a new user and returns 201', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'newuser', password: 'pass123', firstName: 'John' });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
  });

  it('rejects missing username/password with 400', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'nopass' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('rejects duplicate username with 400', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(makeUser());

    const res = await request(app)
      .post('/api/register')
      .send({ username: 'existing', password: 'pw' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('rejects registration when registrationOpen is false', async () => {
    jest.spyOn(AppSettings, 'findOne').mockResolvedValue(makeSettings({ registrationOpen: false }));

    const res = await request(app)
      .post('/api/register')
      .send({ username: 'blocked', password: 'pw' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/closed/i);
  });
});

// ── POST /api/login ───────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  it('returns token + refreshToken on valid credentials', async () => {
    const hash = await bcrypt.hash('correct123', 10);
    jest.spyOn(User, 'findOne').mockResolvedValue(makeUser({ password: hash }));

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'correct123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');

    const payload = jwt.decode(res.body.token);
    expect(payload).toMatchObject({ username: 'testuser', isVerified: true });
  });

  it('rejects wrong password with 401', async () => {
    const hash = await bcrypt.hash('realpassword', 10);
    jest.spyOn(User, 'findOne').mockResolvedValue(makeUser({ password: hash }));

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects unknown username with 401', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'nobody', password: 'anything' });

    expect(res.status).toBe(401);
  });

  it('rejects paused account with 401', async () => {
    const hash = await bcrypt.hash('pw', 10);
    jest.spyOn(User, 'findOne').mockResolvedValue(makeUser({ password: hash, paused: true }));

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'paused', password: 'pw' });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('returns a new access token from a valid refresh token', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const refreshToken = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });

    const mockSelect = { _id: userId, username: 'testuser', isVerified: true, role: 'user', approved: true, paused: false };
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockSelect),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    const payload = jwt.decode(res.body.token);
    expect(payload.userId).toBe(userId);
  });

  it('rejects a garbage token with 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'garbage.token.here' });

    expect(res.status).toBe(401);
  });

  it('rejects missing refreshToken with 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(401);
  });

  it('rejects refresh for a paused user', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const refreshToken = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });

    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: 'u', paused: true }),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/auth/status ──────────────────────────────────────────────────────

describe('GET /api/auth/status', () => {
  function makeToken(overrides = {}) {
    return jwt.sign({ userId: '507f1f77bcf86cd799439011', username: 'u', isVerified: true, role: 'user', ...overrides }, SECRET, { expiresIn: '1h' });
  }

  it('returns approval status for an authenticated user', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ approved: false, isVerified: false }),
    });

    const res = await request(app)
      .get('/api/auth/status')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('approved');
    expect(res.body).toHaveProperty('isVerified');
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/status');
    expect(res.status).toBe(401);
  });
});
