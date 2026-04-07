'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const AppSettings = require('../models/AppSettings');

const SECRET = process.env.JWT_SECRET;

const ADMIN_ID = '507f1f77bcf86cd799439011';
const USER_ID  = '507f1f77bcf86cd799439022';

function makeToken(role = 'admin', userId = ADMIN_ID) {
  return jwt.sign({ userId, username: 'admin', isVerified: true, role }, SECRET, { expiresIn: '1h' });
}

function makeUser(overrides = {}) {
  return {
    _id: USER_ID,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    paused: false,
    approved: false,
    isVerified: false,
    building: 'Test Building',
    createdAt: new Date(),
    toObject: function () { return { ...this }; },
    ...overrides,
  };
}

// ── Admin route protection ────────────────────────────────────────────────────

describe('Admin route protection', () => {
  it('returns 403 for non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${makeToken('user')}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('grants access to admin users', async () => {
    jest.spyOn(User, 'find').mockResolvedValue([makeUser()]);
    jest.spyOn(Car, 'countDocuments').mockResolvedValue(3);
    jest.spyOn(Booking, 'find').mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalListings');
    expect(res.body).toHaveProperty('totalBookings');
  });
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns a list of all users', async () => {
    jest.spyOn(User, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([makeUser({ username: 'alice' }), makeUser({ username: 'bob' })]),
    });
    jest.spyOn(Car, 'aggregate').mockResolvedValue([]);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});

// ── GET /api/admin/pending-users ──────────────────────────────────────────────

describe('GET /api/admin/pending-users', () => {
  it('returns only users with approved=false', async () => {
    jest.spyOn(User, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([
        makeUser({ username: 'pending1', approved: false }),
        makeUser({ username: 'pending2', approved: false }),
      ]),
    });

    const res = await request(app)
      .get('/api/admin/pending-users')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    res.body.forEach(u => expect(u.approved).toBe(false));
  });
});

// ── PUT /api/admin/users/:id/approve ─────────────────────────────────────────

describe('PUT /api/admin/users/:id/approve', () => {
  it('sets approved=true and isVerified=true', async () => {
    const approvedUser = makeUser({ approved: true, isVerified: true });
    jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
      select: jest.fn().mockResolvedValue(approvedUser),
    });

    const res = await request(app)
      .put(`/api/admin/users/${USER_ID}/approve`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(true);
    expect(res.body.isVerified).toBe(true);
  });

  it('returns 404 when user is not found', async () => {
    jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .put('/api/admin/users/000000000000000000000001/approve')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── PUT /api/admin/users/:id ──────────────────────────────────────────────────

describe('PUT /api/admin/users/:id', () => {
  it('can pause a user', async () => {
    const pausedUser = makeUser({ paused: true });
    jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
      select: jest.fn().mockResolvedValue(pausedUser),
    });

    const res = await request(app)
      .put(`/api/admin/users/${USER_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ paused: true });

    expect(res.status).toBe(200);
    expect(res.body.paused).toBe(true);
  });
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────

describe('DELETE /api/admin/users/:id', () => {
  it('deletes the user and associated data', async () => {
    jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue({});
    jest.spyOn(Car, 'deleteMany').mockResolvedValue({});
    jest.spyOn(Booking, 'deleteMany').mockResolvedValue({});

    const res = await request(app)
      .delete(`/api/admin/users/${USER_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith(USER_ID);
    expect(Car.deleteMany).toHaveBeenCalledWith({ userId: USER_ID });
  });
});

// ── GET /api/admin/settings ───────────────────────────────────────────────────

describe('GET /api/admin/settings', () => {
  it('returns app settings', async () => {
    jest.spyOn(AppSettings, 'findOne').mockResolvedValue({ registrationOpen: true, requireApproval: true });

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('registrationOpen');
    expect(res.body).toHaveProperty('requireApproval');
  });
});

// ── PUT /api/admin/settings ───────────────────────────────────────────────────

describe('PUT /api/admin/settings', () => {
  it('updates registrationOpen', async () => {
    const updatedSettings = { registrationOpen: false, requireApproval: true };
    jest.spyOn(AppSettings, 'findOne').mockResolvedValue({ _id: '111', ...updatedSettings });
    jest.spyOn(AppSettings, 'findByIdAndUpdate').mockResolvedValue(updatedSettings);

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ registrationOpen: false });

    expect(res.status).toBe(200);
    expect(res.body.registrationOpen).toBe(false);
  });
});
