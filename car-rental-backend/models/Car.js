const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  licensePlate: { type: String, required: true },
  state: { type: String },
  trim: { type: String },
  type: { type: String, required: true }, // Electric, Hybrid, Gas
  seats: { type: Number, default: 5 },
  transmission: { type: String, default: 'Automatic' },
  price: { type: Number, required: true },    // daily
  pricehr: { type: Number, default: 0 },       // hourly
  description: { type: String },
  rules: [String],                             // ['No Smoking', 'Pet Friendly', ...]
  fuelPolicy: { type: String, default: 'Full to Full' },
  dailyDistanceLimit: { type: Number, default: 200 },
  images: [String],
  available: { type: Boolean, default: true },
  // Availability scheduling
  weeklySchedule: {
    sun: { type: Boolean, default: true },
    mon: { type: Boolean, default: true },
    tue: { type: Boolean, default: true },
    wed: { type: Boolean, default: true },
    thu: { type: Boolean, default: true },
    fri: { type: Boolean, default: true },
    sat: { type: Boolean, default: true },
  },
  availableHoursStart: { type: String, default: '07:00' },
  availableHoursEnd:   { type: String, default: '21:00' },
  blockedDates: [{ type: String }], // 'YYYY-MM-DD' strings
  building:   { type: String, default: '' },   // display name
  buildingId: { type: String, default: '' },   // reference to Building._id
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Car', carSchema);
