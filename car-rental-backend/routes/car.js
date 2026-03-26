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
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      req.user = decoded;
      req.userId = decoded.userId;
      next();
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// POST /api/cars — upload a car
router.post('/cars', authenticate, async (req, res) => {
  try {
    const {
      make, model, year, licensePlate, state, trim, type, seats,
      transmission, price, pricehr, description, rules, fuelPolicy,
      dailyDistanceLimit, images, available,
    } = req.body;

    const car = new Car({
      make, model, year, licensePlate, state, trim, type, seats,
      transmission, price, pricehr, description, rules, fuelPolicy,
      dailyDistanceLimit, images, available,
      userId: req.userId,
    });

    await car.save();
    res.status(201).json(car);
  } catch (error) {
    console.error('Error uploading car:', error);
    res.status(500).json({ message: 'Error uploading car' });
  }
});

// GET /api/user-cars — get cars for the logged-in user
router.get('/user-cars', authenticate, async (req, res) => {
  try {
    const cars = await Car.find({ userId: req.userId });
    res.json(cars || []);
  } catch (error) {
    console.error('Error fetching user cars:', error);
    res.status(500).json({ message: 'Error fetching cars' });
  }
});

// GET /api/cars — get all cars with optional filters
router.get('/cars', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { make: regex },
        { model: regex },
        { description: regex },
      ];
    }

    const cars = await Car.find(filter);
    res.json(cars || []);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Error fetching cars' });
  }
});

// GET /api/cars/:id — get a single car with owner details
router.get('/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate(
      'userId',
      'firstName lastName username avgRating tripCount createdAt'
    );
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Error fetching car' });
  }
});

// DELETE /api/cars/:id — delete a car
router.delete('/cars/:id', authenticate, async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.status(200).json({ message: 'Car deleted' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Error deleting car' });
  }
});

// PUT /api/cars/:id — update car details
router.put('/cars/:id', authenticate, async (req, res) => {
  try {
    const {
      make, model, year, licensePlate, state, trim, type, seats,
      transmission, price, pricehr, description, rules, fuelPolicy,
      dailyDistanceLimit, images, available,
    } = req.body;

    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        make, model, year, licensePlate, state, trim, type, seats,
        transmission, price, pricehr, description, rules, fuelPolicy,
        dailyDistanceLimit, images, available,
      },
      { new: true }
    );

    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ message: 'Error updating car' });
  }
});

module.exports = router;
