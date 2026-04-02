const express = require('express');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { jwtSecret: secretKey } = require('../config');

// Middleware to authenticate and get user ID from token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      req.user = decoded;
      req.userId = decoded.userId;
      next();
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// POST /api/cars — upload a car
router.post('/cars', authenticate, async (req, res) => {
  try {
    const {
      make, model, year, licensePlate, state, trim, type, seats,
      transmission, price, pricehr, description, rules, fuelPolicy,
      dailyDistanceLimit, images, available,
      weeklySchedule, availableHoursStart, availableHoursEnd,
    } = req.body;

    // Pull building info from the host's profile
    const host = await User.findById(req.userId).select('building buildingId');

    const car = new Car({
      make, model, year, licensePlate, state, trim, type, seats,
      transmission, price, pricehr, description, rules, fuelPolicy,
      dailyDistanceLimit, images, available,
      weeklySchedule, availableHoursStart, availableHoursEnd,
      building:   host?.building   || '',
      buildingId: host?.buildingId || '',
      userId: req.userId,
    });

    await car.save();
    res.status(201).json(car);
  } catch (error) {
    console.error('Error uploading car:', error);
    res.status(500).json({ message: 'Error uploading car' });
  }
});

// GET /api/user-cars — get cars for the logged-in user
router.get('/user-cars', authenticate, async (req, res) => {
  try {
    const cars = await Car.find({ userId: req.userId });
    res.json(cars || []);
  } catch (error) {
    console.error('Error fetching user cars:', error);
    res.status(500).json({ message: 'Error fetching cars' });
  }
});

// GET /api/cars — get all cars with optional filters including date availability
router.get('/cars', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, search, startDate, endDate } = req.query;
    const filter = {};

    // Filter by the requester's building if they are logged in
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const { jwtSecret } = require('../config');
        const decoded = jwt.verify(authHeader.split(' ')[1], jwtSecret);
        const viewer = await User.findById(decoded.userId).select('buildingId');
        if (viewer?.buildingId) filter.buildingId = viewer.buildingId;
      } catch { /* unauthenticated or bad token — show all */ }
    }

    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ make: regex }, { model: regex }, { description: regex }];
    }

    let cars = await Car.find(filter);

    // Date availability filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end   = new Date(endDate);

      // Cars with overlapping confirmed/active/pending bookings
      const bookedBookings = await Booking.find({
        status: { $in: ['confirmed', 'active', 'pending'] },
        startDate: { $lte: end },
        endDate:   { $gte: start },
      }).select('carId');
      const bookedCarIds = new Set(bookedBookings.map(b => b.carId.toString()));

      // Build set of day-names and date strings in the requested range
      const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const requiredDayNames = new Set();
      const dateStrings = [];
      for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
        requiredDayNames.add(DAY_NAMES[d.getDay()]);
        dateStrings.push(d.toISOString().split('T')[0]);
      }

      cars = cars.filter(car => {
        if (bookedCarIds.has(car._id.toString())) return false;
        const ws = car.weeklySchedule || {};
        for (const day of requiredDayNames) {
          if (ws[day] === false) return false;
        }
        const blocked = car.blockedDates || [];
        if (blocked.some(d => dateStrings.includes(d))) return false;
        return true;
      });
    }

    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Error fetching cars' });
  }
});

// GET /api/cars/:id — get a single car with owner details
router.get('/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate(
      'userId',
      'firstName lastName username avgRating tripCount createdAt'
    );
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Error fetching car' });
  }
});

// DELETE /api/cars/:id — delete a car
router.delete('/cars/:id', authenticate, async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.status(200).json({ message: 'Car deleted' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Error deleting car' });
  }
});

// PUT /api/cars/:id — update car details
router.put('/cars/:id', authenticate, async (req, res) => {
  try {
    const {
      make, model, year, licensePlate, state, trim, type, seats,
      transmission, price, pricehr, description, rules, fuelPolicy,
      dailyDistanceLimit, images, available,
      weeklySchedule, availableHoursStart, availableHoursEnd,
    } = req.body;

    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        make, model, year, licensePlate, state, trim, type, seats,
        transmission, price, pricehr, description, rules, fuelPolicy,
        dailyDistanceLimit, images, available,
        ...(weeklySchedule     && { weeklySchedule }),
        ...(availableHoursStart && { availableHoursStart }),
        ...(availableHoursEnd   && { availableHoursEnd }),
      },
      { new: true }
    );

    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ message: 'Error updating car' });
  }
});

// GET /api/cars/:id/availability?year=2026&month=4
router.get('/cars/:id/availability', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .select('weeklySchedule availableHoursStart availableHoursEnd blockedDates');
    if (!car) return res.status(404).json({ message: 'Car not found' });

    let bookings = [];
    const { year, month } = req.query;
    if (year && month) {
      const y = parseInt(year), m = parseInt(month);
      const start = new Date(y, m - 1, 1);
      const end   = new Date(y, m, 0, 23, 59, 59);
      bookings = await Booking.find({
        carId:     req.params.id,
        status:    { $in: ['confirmed', 'active', 'pending'] },
        startDate: { $lte: end },
        endDate:   { $gte: start },
      }).select('startDate endDate status');
    }

    res.json({
      weeklySchedule:     car.weeklySchedule      || {},
      availableHoursStart: car.availableHoursStart || '07:00',
      availableHoursEnd:   car.availableHoursEnd   || '21:00',
      blockedDates:        car.blockedDates         || [],
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching availability' });
  }
});

// PUT /api/cars/:id/availability
router.put('/cars/:id/availability', authenticate, async (req, res) => {
  try {
    const { weeklySchedule, availableHoursStart, availableHoursEnd, blockedDates } = req.body;
    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { weeklySchedule, availableHoursStart, availableHoursEnd, blockedDates },
      { new: true }
    );
    if (!car) return res.status(404).json({ message: 'Car not found or unauthorized' });
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability' });
  }
});

module.exports = router;
