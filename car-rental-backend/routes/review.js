const express = require('express');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

const router = express.Router();
const secretKey = 'your_secret_key';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// POST /api/reviews — submit a review for a booking
router.post('/reviews', authenticate, async (req, res) => {
  try {
    const { bookingId, vehicleRatings, ownerRatings, publicNote } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const reviewerId = req.user.userId;
    // Reviewer must be the renter of this booking
    if (String(booking.renterId) !== String(reviewerId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const review = new Review({
      bookingId,
      reviewerId,
      revieweeId: booking.ownerId,
      carId: booking.carId,
      vehicleRatings,
      ownerRatings,
      publicNote,
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

// GET /api/reviews/user/:userId — get reviews written about a user
router.get('/reviews/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate('reviewerId', 'firstName lastName username')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

module.exports = router;
