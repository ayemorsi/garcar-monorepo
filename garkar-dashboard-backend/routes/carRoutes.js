const express = require('express');
const Car = require('../models/Car'); // Ensure the correct path

const router = express.Router();

// Route to get all cars
router.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Error fetching cars');
  }
});

// Add other car routes here (e.g., create, update, delete)

module.exports = router;
