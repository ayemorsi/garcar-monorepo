const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationData: {
    state: String,
    city: String,
    apartment: String,
    verificationDocument: String,
  },
});

module.exports = mongoose.model('User', userSchema);
