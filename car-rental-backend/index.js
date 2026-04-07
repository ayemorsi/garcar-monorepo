const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('./models/User');
const Booking = require('./models/Booking');
const carRoutes = require('./routes/car');
const bookingRoutes = require('./routes/booking');
const messageRoutes = require('./routes/message');
const userRoutes = require('./routes/user');

const { jwtSecret: secretKey, mongoUrl, port } = require('./config');
const logger = require('./lib/logger');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch(err => {
        logger.error({ err }, 'MongoDB connection error');
    });

// Middleware to authenticate and get user ID from token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, isVerified: false });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error registering user');
    res.status(500).send('Error registering user');
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user._id, isVerified: user.isVerified }, secretKey, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    logger.error({ err: error }, 'Error logging in');
    res.status(500).send('Error logging in');
  }
});

// Verify user endpoint with verification data
const upload = multer({ dest: 'uploads/' });
app.post('/api/verify/:userId', authenticate, upload.single('verificationDocument'), async (req, res) => {
  try {
    const { state, city, apartment } = req.body;
    const verificationDocument = req.file.path;
    await User.findByIdAndUpdate(req.params.userId, {
      verificationData: {
        state,
        city,
        apartment,
        verificationDocument,
      },
      isVerified: true,
    });
    const user = await User.findById(req.params.userId);
    const token = jwt.sign({ userId: user._id, username: user.username, isVerified: user.isVerified }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    logger.error({ err: error }, 'Error submitting verification data');
    res.status(500).send('Error submitting verification data');
  }
});

// Route to fetch user verification data
app.get('/api/verification/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json(user.verificationData);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching verification data');
    res.status(500).send('Error fetching verification data');
  }
});

// GET /api/host/stats — host dashboard stats
app.get('/api/host/stats', authenticate, async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const Car = require('./models/Car');

    const [allBookings, carsCount] = await Promise.all([
      Booking.find({ ownerId }),
      Car.countDocuments({ userId: ownerId }),
    ]);

    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const activeBookings = allBookings.filter(b => b.status === 'active' || b.status === 'confirmed').length;
    const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Stub: no review system yet, return 0
    const avgRating = 0;

    res.json({
      totalEarnings,
      activeBookings,
      completedBookings: completedBookings.length,
      avgRating,
      carsCount,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching host stats');
    res.status(500).json({ message: 'Error fetching host stats' });
  }
});

// Use routes
app.use('/api', carRoutes);
app.use('/api', bookingRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);

// Start the server
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});
