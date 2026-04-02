const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationData: {
    state: String,
    city: String,
    apartment: String,
    verificationDocument: { type: String, maxlength: 20000000 },
  },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  bio: { type: String },
  avgRating: { type: Number, default: 0 },
  tripCount: { type: Number, default: 0 },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  paused: { type: Boolean, default: false },
  approved: { type: Boolean, default: true },
  building: { type: String, default: '' },      // display name
  buildingId: { type: String, default: '' },    // reference to Building._id
  lastSeen: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
