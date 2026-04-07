'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Car = require('../models/Car');
const User = require('../models/User');
const Booking = require('../models/Booking');

const SECRET = process.env.JWT_SECRET;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(overrides = {}) {
  return jwt.sign({
    userId: '507f1f77bcf86cd799439011',
    username: 'tester',
    isVerified: true,
    role: 'user',
    ...overrides,
  }, SECRET, { expiresIn: '1h' });
}

function makeCar(overrides = {}) {
  const id = '507f1f77bcf86cd799439012';
  return {
    _id: id,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'TEST123',
    type: 'Gas',
    price: 50,
    pricehr: 10,
    available: true,
    userId: '507f1f77bcf86cd799439011',
    buildingId: 'bldA',
    building: 'Test Building',
    weeklySchedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
    availableHoursStart: '07:00',
    availableHoursEnd: '21:00',
    blockedDates: [],
    toObject: function () { return { ...this }; },
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    username: 'tester',
    buildingId: 'bldA',
    building: 'Test Building',
    ...overrides,
  };
}

// ── POST /api/cars ────────────────────────────────────────────────────────────

describe('POST /api/cars', () => {
  it('creates a car listing for an authenticated user and returns 201', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(makeUser()),
    });
    const savedCar = makeCar();
    jest.spyOn(Car.prototype, 'save').mockResolvedValue(savedCar);

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ make: 'Honda', model: 'Civic', year: 2021, licensePlate: 'ABC123', type: 'Gas', price: 45 });

    expect(res.status).toBe(201);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/cars')
      .send({ make: 'Honda' });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/cars ─────────────────────────────────────────────────────────────

describe('GET /api/cars', () => {
  it('filters by buildingId for authenticated users', async () => {
    const carA = makeCar({ buildingId: 'bldA' });
    const carB = makeCar({ _id: '507f1f77bcf86cd799439099', buildingId: 'bldB' });

    // Return user with buildingId bldA so filter is applied
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(makeUser({ buildingId: 'bldA' })),
    });
    // Car.find should be called with { buildingId: 'bldA' }
    jest.spyOn(Car, 'find').mockResolvedValue([carA]);
    jest.spyOn(Booking, 'find').mockResolvedValue([]);

    const res = await request(app)
      .get('/api/cars')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // The filter call should have included buildingId
    expect(Car.find).toHaveBeenCalledWith(expect.objectContaining({ buildingId: 'bldA' }));
  });

  it('returns all cars for unauthenticated requests (no building filter)', async () => {
    jest.spyOn(Car, 'find').mockResolvedValue([makeCar(), makeCar({ _id: '507f1f77bcf86cd799439099' })]);
    jest.spyOn(Booking, 'find').mockResolvedValue([]);

    const res = await request(app).get('/api/cars');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    // No buildingId in the filter
    expect(Car.find).toHaveBeenCalledWith(expect.not.objectContaining({ buildingId: expect.anything() }));
  });

  it('applies type filter', async () => {
    jest.spyOn(Car, 'find').mockResolvedValue([makeCar({ type: 'Electric' })]);
    jest.spyOn(Booking, 'find').mockResolvedValue([]);

    const res = await request(app).get('/api/cars?type=Electric');

    expect(res.status).toBe(200);
    expect(Car.find).toHaveBeenCalledWith(expect.objectContaining({ type: 'Electric' }));
  });
});

// ── GET /api/cars/:id ─────────────────────────────────────────────────────────

describe('GET /api/cars/:id', () => {
  it('returns the car with populated owner details', async () => {
    const car = {
      ...makeCar(),
      userId: { _id: '507f1f77bcf86cd799439011', username: 'tester', firstName: 'Test', lastName: 'User', avgRating: 4.5, tripCount: 3, createdAt: new Date() },
    };
    jest.spyOn(Car, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(car),
    });

    const res = await request(app).get('/api/cars/507f1f77bcf86cd799439012');

    expect(res.status).toBe(200);
    expect(res.body.make).toBe('Toyota');
  });

  it('returns 404 for a non-existent car', async () => {
    jest.spyOn(Car, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get('/api/cars/000000000000000000000001');

    expect(res.status).toBe(404);
  });
});

// ── PUT /api/cars/:id ─────────────────────────────────────────────────────────

describe('PUT /api/cars/:id', () => {
  it('allows the owner to update their car', async () => {
    const updatedCar = makeCar({ make: 'Honda', model: 'Accord' });
    jest.spyOn(Car, 'findOneAndUpdate').mockResolvedValue(updatedCar);

    const res = await request(app)
      .put('/api/cars/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ make: 'Honda', model: 'Accord', year: 2023, licensePlate: 'XYZ', type: 'Gas', price: 60 });

    expect(res.status).toBe(200);
    expect(res.body.make).toBe('Honda');
  });

  it('returns 404 when car is not owned by the requester', async () => {
    jest.spyOn(Car, 'findOneAndUpdate').mockResolvedValue(null); // ownership check fails

    const res = await request(app)
      .put('/api/cars/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${makeToken({ userId: 'differentuser' })}`)
      .send({ make: 'Evil', model: 'Update', year: 2023, licensePlate: 'X', type: 'Gas', price: 1 });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/cars/:id ──────────────────────────────────────────────────────

describe('DELETE /api/cars/:id', () => {
  it('allows the owner to delete their car', async () => {
    jest.spyOn(Car, 'findOneAndDelete').mockResolvedValue(makeCar());

    const res = await request(app)
      .delete('/api/cars/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when car is not found or not owned by requester', async () => {
    jest.spyOn(Car, 'findOneAndDelete').mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/cars/507f1f77bcf86cd799439012')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /api/cars/:id/availability ────────────────────────────────────────────

describe('GET /api/cars/:id/availability', () => {
  it('returns availability data for an existing car', async () => {
    const car = makeCar();
    jest.spyOn(Car, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(car),
    });
    jest.spyOn(Booking, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/cars/507f1f77bcf86cd799439012/availability?year=2026&month=1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('weeklySchedule');
    expect(res.body).toHaveProperty('availableHoursStart');
    expect(res.body).toHaveProperty('availableHoursEnd');
    expect(res.body).toHaveProperty('blockedDates');
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  it('returns 404 for a non-existent car', async () => {
    jest.spyOn(Car, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get('/api/cars/000000000000000000000001/availability');

    expect(res.status).toBe(404);
  });
});
