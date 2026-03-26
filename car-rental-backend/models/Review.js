const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  vehicleRatings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    performance: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 },
  },
  ownerRatings: {
    communication: { type: Number, min: 1, max: 5 },
    handoff: { type: Number, min: 1, max: 5 },
  },
  publicNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', reviewSchema);
