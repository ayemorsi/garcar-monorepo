const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  model: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  pricehr: { type: Number, required: true },
  year: { type: Number, required: true },
  image: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Car', carSchema);
