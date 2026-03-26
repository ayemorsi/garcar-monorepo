const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const router = express.Router();

const secretKey = 'your_secret_key';

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
    const { carId, startDate, endDate, message } = req.body;
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalPrice = days * car.price;

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

    // Notify the car owner
    const renterName = req.user.username;
    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    await Notification.create({
      userId: car.userId,
      type: 'new_booking',
      title: 'New Booking Request',
      message: `${renterName} wants to book your ${car.make} ${car.model} from ${fmt(startDate)} to ${fmt(endDate)}.`,
      bookingId: booking._id,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
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
    console.error('Error fetching bookings:', error);
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
    console.error('Error fetching owner bookings:', error);
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
    console.error('Error fetching booking:', error);
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
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

module.exports = router;
