const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const { jwtSecret: secretKey } = require('../config');
const logger = require('../lib/logger');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      req.user = decoded;
      next();
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// POST /api/bookings — create a new booking
router.post('/bookings', authenticate, async (req, res) => {
  try {
    const { carId, startDate, endDate, startTime, endTime, bookingType, message } = req.body;
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // ── Availability validation ───────────────────────────────────────────────
    const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const ws = car.weeklySchedule || {};

    function dayLabel(d) {
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }

    function toMinutes(hhmm) {
      const [h, m] = (hhmm || '00:00').split(':').map(Number);
      return h * 60 + m;
    }

    function fmtTime(hhmm) {
      const [h, m] = (hhmm || '00:00').split(':').map(Number);
      const ampm = h < 12 ? 'am' : 'pm';
      const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    if (bookingType === 'hourly') {
      const bookDate = new Date(`${startDate}T00:00`);
      const dayName  = DAY_NAMES[bookDate.getDay()];
      if (ws[dayName] === false) {
        return res.status(400).json({ message: `This car is not available on ${dayLabel(bookDate)}s. Check the host's schedule.` });
      }
      const reqStart = toMinutes(startTime || '09:00');
      const reqEnd   = toMinutes(endTime   || '10:00');
      const avStart  = toMinutes(car.availableHoursStart || '07:00');
      const avEnd    = toMinutes(car.availableHoursEnd   || '21:00');
      if (reqStart < avStart || reqEnd > avEnd) {
        return res.status(400).json({
          message: `Available hours are ${fmtTime(car.availableHoursStart)} – ${fmtTime(car.availableHoursEnd)} on this day.`,
        });
      }
    } else {
      const rangeStart = new Date(startDate);
      const rangeEnd   = new Date(endDate);
      for (let d = new Date(rangeStart); d < rangeEnd; d = new Date(d.getTime() + 86400000)) {
        const dayName = DAY_NAMES[d.getDay()];
        if (ws[dayName] === false) {
          return res.status(400).json({ message: `This car is not available on ${dayLabel(d)}s. Check the host's schedule.` });
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    let start, end, totalPrice, notifDesc;
    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (bookingType === 'hourly' && car.pricehr > 0) {
      // Hourly: startDate is the date, startTime/endTime are HH:MM
      const dateStr = startDate; // e.g. "2024-06-15"
      start = new Date(`${dateStr}T${startTime || '09:00'}`);
      end   = new Date(`${dateStr}T${endTime   || '10:00'}`);
      if (end <= start) end = new Date(start.getTime() + 60 * 60 * 1000); // at least 1 hr
      const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
      totalPrice = hours * car.pricehr;
      notifDesc = `${req.user.username} wants to book your ${car.make} ${car.model} on ${fmt(start)} from ${startTime} to ${endTime} (${hours}h).`;
    } else {
      // Daily
      start = new Date(startDate);
      end   = new Date(endDate);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      totalPrice = days * car.price;
      notifDesc = `${req.user.username} wants to book your ${car.make} ${car.model} from ${fmt(startDate)} to ${fmt(endDate)}.`;
    }

    const booking = new Booking({
      carId,
      renterId: req.user.userId,
      ownerId: car.userId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: 'pending',
      message: message || '',
    });

    await booking.save();

    await Notification.create({
      userId: car.userId,
      type: 'new_booking',
      title: 'New Booking Request',
      message: notifDesc,
      bookingId: booking._id,
    });

    res.status(201).json(booking);
  } catch (error) {
    logger.error({ err: error }, 'Error creating booking');
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// GET /api/bookings — get all bookings for the logged-in renter
router.get('/bookings', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ renterId: req.user.userId })
      .populate('carId', 'make model year images price')
      .populate('ownerId', 'firstName lastName username')
      .sort({ startDate: -1 });
    res.json(bookings || []);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching bookings');
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// GET /api/bookings/owner — get all bookings for the logged-in owner
router.get('/bookings/owner', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user.userId })
      .populate('carId', 'make model year licensePlate')
      .populate('renterId', 'firstName lastName username avgRating tripCount')
      .sort({ createdAt: -1 });
    res.json(bookings || []);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching owner bookings');
    res.status(500).json({ message: 'Error fetching owner bookings' });
  }
});

// GET /api/bookings/:id — get a single booking
router.get('/bookings/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('carId')
      .populate('renterId', 'firstName lastName username avgRating tripCount');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching booking');
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// PUT /api/bookings/:id — update booking status (owner only)
router.put('/bookings/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden: only the car owner can update booking status' });
    }

    booking.status = status;
    await booking.save();

    // Notify the renter of the status change
    const car = await Car.findById(booking.carId).select('make model');
    const carName = car ? `${car.make} ${car.model}` : 'your car';
    if (status === 'confirmed') {
      await Notification.create({
        userId: booking.renterId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: `Your booking for the ${carName} has been confirmed by the host.`,
        bookingId: booking._id,
      });
    } else if (status === 'cancelled') {
      await Notification.create({
        userId: booking.renterId,
        type: 'booking_cancelled',
        title: 'Booking Declined',
        message: `Your booking request for the ${carName} was declined by the host.`,
        bookingId: booking._id,
      });
    }

    res.json(booking);
  } catch (error) {
    logger.error({ err: error }, 'Error updating booking');
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// POST /api/bookings/:id/checkin — renter uploads pre-trip damage photos, moves to 'active'
router.post('/bookings/:id/checkin', authenticate, upload.array('photos', 20), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.renterId.toString() !== req.user.userId)
      return res.status(403).json({ message: 'Forbidden' });
    if (booking.status !== 'confirmed')
      return res.status(400).json({ message: 'Booking must be confirmed before check-in' });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'At least one photo is required' });

    booking.checkInPhotos = req.files.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    booking.checkedInAt = new Date();
    booking.status = 'active';
    await booking.save();
    res.json(booking);
  } catch (error) {
    logger.error({ err: error }, 'Error checking in');
    res.status(500).json({ message: 'Error checking in' });
  }
});

// POST /api/bookings/:id/checkout — renter uploads post-trip damage photos, moves to 'completed'
router.post('/bookings/:id/checkout', authenticate, upload.array('photos', 20), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.renterId.toString() !== req.user.userId)
      return res.status(403).json({ message: 'Forbidden' });
    if (booking.status !== 'active')
      return res.status(400).json({ message: 'Booking must be active before check-out' });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'At least one photo is required' });

    booking.checkOutPhotos = req.files.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    booking.checkedOutAt = new Date();
    booking.status = 'completed';
    await booking.save();

    // Notify the owner that the trip is complete
    const car = await Car.findById(booking.carId).select('make model userId');
    if (car) {
      await Notification.create({
        userId: car.userId,
        type: 'booking_completed',
        title: 'Trip Completed',
        message: `Your ${car.make} ${car.model} has been returned. Check-out photos are available.`,
        bookingId: booking._id,
      });
    }
    res.json(booking);
  } catch (error) {
    logger.error({ err: error }, 'Error checking out');
    res.status(500).json({ message: 'Error checking out' });
  }
});

// GET /api/bookings/:id/photos — owner or renter can view damage photos
router.get('/bookings/:id/photos', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .select('checkInPhotos checkOutPhotos checkedInAt checkedOutAt renterId ownerId carId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (
      booking.renterId.toString() !== req.user.userId &&
      booking.ownerId.toString() !== req.user.userId
    ) return res.status(403).json({ message: 'Forbidden' });

    res.json({
      checkInPhotos: booking.checkInPhotos || [],
      checkOutPhotos: booking.checkOutPhotos || [],
      checkedInAt: booking.checkedInAt,
      checkedOutAt: booking.checkedOutAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos' });
  }
});

module.exports = router;
