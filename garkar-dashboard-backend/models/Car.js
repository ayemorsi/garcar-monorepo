const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  model: String,
  type: String,
  price: Number,
  year: Number,
  picture: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Car', carSchema);
