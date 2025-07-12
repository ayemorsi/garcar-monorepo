const express = require('express');
const Car = require('../models/Car');
const jwt = require('jsonwebtoken');
const router = express.Router();

const secretKey = 'your_secret_key'; // Should be stored in environment variables

// Middleware to authenticate and get user ID from token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(401).send('Unauthorized');
      req.userId = decoded.userId;
      next();
    });
  } else {
    return res.status(401).send('Unauthorized');
  }
};

// Upload a car
router.post('/cars', authenticate, async (req, res) => {
  try {
    const { model, type, price, pricehr, year, image } = req.body;
    const car = new Car({ model, type, price, pricehr, year, image, userId: req.userId });
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(500).send('Error uploading car');
  }
});

// Get cars for the logged-in user
router.get('/user-cars', authenticate, async (req, res) => {
  try {
    const cars = await Car.find({ userId: req.userId });
    res.json(cars);
  } catch (error) {
    res.status(500).send('Error fetching cars');
  }
});

// Get all cars
router.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).send('Error fetching cars');
  }
});

// Delete a car
router.delete('/cars/:id', authenticate, async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!car) {
      return res.status(404).send('Car not found');
    }
    res.status(200).send('Car deleted');
  } catch (error) {
    res.status(500).send('Error deleting car');
  }
});

// Update car price
router.put('/cars/:id', authenticate, async (req, res) => {
  try {
    const { price, pricehr } = req.body;
    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { price, pricehr },
      { new: true }
    );
    if (!car) {
      return res.status(404).send('Car not found');
    }
    res.json(car);
  } catch (error) {
    res.status(500).send('Error updating car');
  }
});

module.exports = router;
