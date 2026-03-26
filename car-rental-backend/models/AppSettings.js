const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  registrationOpen: { type: Boolean, default: true },
  requireApproval: { type: Boolean, default: false },
});

module.exports = mongoose.model('AppSettings', appSettingsSchema);
