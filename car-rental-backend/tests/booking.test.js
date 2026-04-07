'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Notification = require('../models/Notification');

const SECRET = process.env.JWT_SECRET;

// ── Helpers ──────────────────────────────────────────────────────────────────

const RENTER_ID  = '507f1f77bcf86cd799439011';
const OWNER_ID   = '507f1f77bcf86cd799439022';
const CAR_ID     = '507f1f77bcf86cd799439033';
const BOOKING_ID = '507f1f77bcf86cd799439044';

function makeToken(userId = RENTER_ID, role = 'user') {
  return jwt.sign({ userId, username: 'tester', isVerified: true, role }, SECRET, { expiresIn: '1h' });
}

function makeCar(overrides = {}) {
  return {
    _id: CAR_ID,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    price: 50,
    pricehr: 10,
    userId: OWNER_ID,
    available: true,
    weeklySchedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
    availableHoursStart: '07:00',
    availableHoursEnd: '21:00',
    blockedDates: [],
    ...overrides,
  };
}

function makeBooking(overrides = {}) {
  return {
    _id: BOOKING_ID,
    carId: CAR_ID,
    renterId: RENTER_ID,
    ownerId: OWNER_ID,
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 86400000 * 2),
    totalPrice: 50,
    status: 'pending',
    checkInPhotos: [],
    checkOutPhotos: [],
    save: jest.fn().mockResolvedValue(undefined),
    toString: function () { return this._id; },
    ...overrides,
  };
}

// Mock Notification.create globally — it's called after booking mutations
beforeEach(() => {
  jest.spyOn(Notification, 'create').mockResolvedValue({});
});

// ── POST /api/bookings ────────────────────────────────────────────────────────

describe('POST /api/bookings', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter  = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  it('creates a daily booking and returns 201', async () => {
    jest.spyOn(Car, 'findById').mockResolvedValue(makeCar());
    jest.spyOn(Booking.prototype, 'save').mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ carId: CAR_ID, startDate: tomorrow, endDate: dayAfter, bookingType: 'daily' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('creates an hourly booking with correct price (pricehr * hours)', async () => {
    jest.spyOn(Car, 'findById').mockResolvedValue(makeCar({ pricehr: 15 }));
    jest.spyOn(Booking.prototype, 'save').mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ carId: CAR_ID, startDate: tomorrow, startTime: '09:00', endTime: '11:00', bookingType: 'hourly' });

    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(30); // 2h * $15
  });

  it('rejects a booking on a day the car is unavailable', async () => {
    // Find the next Monday
    const now = new Date();
    const daysUntilMon = (1 - now.getDay() + 7) % 7 || 7;
    const nextMon = new Date(now.getTime() + daysUntilMon * 86400000).toISOString().split('T')[0];
    const nextTue = new Date(new Date(nextMon).getTime() + 86400000).toISOString().split('T')[0];

    jest.spyOn(Car, 'findById').mockResolvedValue(makeCar({
      weeklySchedule: { sun: true, mon: false, tue: true, wed: true, thu: true, fri: true, sat: true },
    }));

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ carId: CAR_ID, startDate: nextMon, endDate: nextTue, bookingType: 'daily' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available on/i);
  });

  it('rejects hourly booking that starts before available hours', async () => {
    jest.spyOn(Car, 'findById').mockResolvedValue(makeCar({
      availableHoursStart: '09:00',
      availableHoursEnd: '17:00',
    }));

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ carId: CAR_ID, startDate: tomorrow, startTime: '07:00', endTime: '10:00', bookingType: 'hourly' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/available hours/i);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ carId: CAR_ID, startDate: tomorrow, endDate: dayAfter });

    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent car', async () => {
    jest.spyOn(Car, 'findById').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ carId: '000000000000000000000001', startDate: tomorrow, endDate: dayAfter, bookingType: 'daily' });

    expect(res.status).toBe(404);
  });
});

// ── GET /api/bookings ─────────────────────────────────────────────────────────

describe('GET /api/bookings', () => {
  it('returns the renter\'s bookings', async () => {
    jest.spyOn(Booking, 'find').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([makeBooking()]),
        }),
      }),
    });

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/bookings/:id (status update) ─────────────────────────────────────

describe('PUT /api/bookings/:id', () => {
  it('allows the owner to confirm a booking', async () => {
    const booking = makeBooking({ ownerId: { toString: () => OWNER_ID } });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
    jest.spyOn(Car, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ make: 'Toyota', model: 'Camry' }),
    });

    const res = await request(app)
      .put(`/api/bookings/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${makeToken(OWNER_ID)}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(booking.status).toBe('confirmed');
  });

  it('rejects status update by non-owner (403)', async () => {
    const booking = makeBooking({ ownerId: { toString: () => OWNER_ID } });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);

    const res = await request(app)
      .put(`/api/bookings/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${makeToken(RENTER_ID)}`) // renter, not owner
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});

// ── POST /api/bookings/:id/checkin ────────────────────────────────────────────

describe('POST /api/bookings/:id/checkin', () => {
  it('rejects check-in if booking is not confirmed', async () => {
    const booking = makeBooking({
      status: 'pending',
      renterId: { toString: () => RENTER_ID },
    });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);

    const res = await request(app)
      .post(`/api/bookings/${BOOKING_ID}/checkin`)
      .set('Authorization', `Bearer ${makeToken(RENTER_ID)}`)
      .attach('photos', Buffer.from('fake image'), 'photo.jpg');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/confirmed/i);
  });

  it('rejects check-in by a non-renter (403)', async () => {
    const booking = makeBooking({
      status: 'confirmed',
      renterId: { toString: () => RENTER_ID },
    });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);

    const res = await request(app)
      .post(`/api/bookings/${BOOKING_ID}/checkin`)
      .set('Authorization', `Bearer ${makeToken(OWNER_ID)}`) // owner, not renter
      .attach('photos', Buffer.from('fake image'), 'photo.jpg');

    expect(res.status).toBe(403);
  });

  it('moves booking to active on successful check-in', async () => {
    const booking = makeBooking({
      status: 'confirmed',
      renterId: { toString: () => RENTER_ID },
      checkInPhotos: [],
    });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);

    const res = await request(app)
      .post(`/api/bookings/${BOOKING_ID}/checkin`)
      .set('Authorization', `Bearer ${makeToken(RENTER_ID)}`)
      .attach('photos', Buffer.from('fake image data'), 'front.jpg');

    expect(res.status).toBe(200);
    expect(booking.status).toBe('active');
    expect(booking.save).toHaveBeenCalled();
  });
});

// ── POST /api/bookings/:id/checkout ───────────────────────────────────────────

describe('POST /api/bookings/:id/checkout', () => {
  it('moves booking to completed on successful checkout', async () => {
    const booking = makeBooking({
      status: 'active',
      renterId: { toString: () => RENTER_ID },
      carId: CAR_ID,
      checkOutPhotos: [],
    });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
    jest.spyOn(Car, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ make: 'Toyota', model: 'Camry', userId: OWNER_ID }),
    });

    const res = await request(app)
      .post(`/api/bookings/${BOOKING_ID}/checkout`)
      .set('Authorization', `Bearer ${makeToken(RENTER_ID)}`)
      .attach('photos', Buffer.from('fake image data'), 'rear.jpg');

    expect(res.status).toBe(200);
    expect(booking.status).toBe('completed');
    expect(booking.save).toHaveBeenCalled();
  });

  it('rejects checkout on a non-active booking (400)', async () => {
    const booking = makeBooking({
      status: 'confirmed', // not active
      renterId: { toString: () => RENTER_ID },
    });
    jest.spyOn(Booking, 'findById').mockResolvedValue(booking);

    const res = await request(app)
      .post(`/api/bookings/${BOOKING_ID}/checkout`)
      .set('Authorization', `Bearer ${makeToken(RENTER_ID)}`)
      .attach('photos', Buffer.from('fake image data'), 'rear.jpg');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/active/i);
  });
});
