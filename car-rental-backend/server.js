const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const User = require('./models/User'); // Ensure the correct path
const AppSettings = require('./models/AppSettings');
const Building = require('./models/Building');
const Booking = require('./models/Booking');
const carRoutes = require('./routes/car');
const bookingRoutes = require('./routes/booking');
const messageRoutes = require('./routes/message');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/review');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notification');

const app = express();
const port = process.env.PORT || 5001;

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

// Middleware
app.use(cors());
app.use((req, res, next) => {
  // Skip for multipart (file uploads) — multer handles those
  if (req.headers['content-type']?.startsWith('multipart/')) return next();
  if (req.body !== undefined) return next();
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    if (raw) {
      try { req.body = JSON.parse(raw); } catch { req.body = {}; }
    } else {
      req.body = {};
    }
    next();
  });
});

// Connect to MongoDB — cached for serverless reuse
let dbConnected = false;
async function connectDB() {
  if (dbConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/carRental', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  dbConnected = true;
  // Seed default buildings if none exist
  const count = await Building.countDocuments();
  if (count === 0) {
    await Building.insertMany([
      { name: '220 Twentieth Street Apartments', address: '220 20th St S, Arlington, VA 22202' },
      { name: 'Crystal Flats', address: '505 18th St S, Arlington, VA 22202' },
      { name: 'Crystal City Lofts', address: '305 10th St S, Arlington, VA 22202' },
    ]);
  }
}

// Ensure DB is connected before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Multer — memory storage so files survive serverless (stored in MongoDB as base64)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
      User.findByIdAndUpdate(user.userId, { lastSeen: new Date() }).exec();
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Route to handle user registration
app.post('/api/register', async (req, res) => {
  try {
    const settings = await AppSettings.findOne() || new AppSettings();
    if (!settings.registrationOpen) {
      return res.status(403).send('Registration is currently closed');
    }
    const { username, password, building } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const approved = !settings.requireApproval;
    const user = new User({ username, password: hashedPassword, approved, building: building || '' });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

// Route to handle user login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      if (user.approved === false) {
        return res.status(401).send('Your account is pending admin approval');
      }
      const token = jwt.sign({ userId: user._id, username: user.username, isVerified: user.isVerified, role: user.role || 'user' }, secretKey, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});

// Route to handle user verification (document stored as base64 in MongoDB)
app.post('/api/verify/:userId', authenticate, upload.single('verificationDocument'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No document uploaded');
    const { state, city, apartment } = req.body;
    const documentData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    await User.findByIdAndUpdate(req.params.userId, {
      verificationData: { state, city, apartment, verificationDocument: documentData },
      isVerified: false,
      approved: false,
    });
    res.json({ message: 'Document submitted. Pending admin review.' });
  } catch (error) {
    console.error('Error submitting verification data:', error);
    res.status(500).send('Error submitting verification data');
  }
});

// Route to fetch user verification data
app.get('/api/verification/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json(user.verificationData);
  } catch (error) {
    console.error('Error fetching verification data:', error);
    res.status(500).send('Error fetching verification data');
  }
});

// Public buildings list (for signup page)
app.get('/api/buildings', async (req, res) => {
  try {
    const buildings = await Building.find({ active: true }).select('name address');
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buildings' });
  }
});

// Use other routes
app.use('/api', carRoutes);
app.use('/api', bookingRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);
app.use('/api', reviewRoutes);
app.use('/api', uploadRoutes);
app.use('/api', adminRoutes);
app.use('/api', notificationRoutes);
app.use('/uploads', express.static('/tmp/uploads'));

// GET /api/host/stats — summary stats for the logged-in host
app.get('/api/host/stats', authenticate, async (req, res) => {
  try {
    const Car = require('./models/Car');
    const ownerId = req.user.userId;
    const [cars, bookings] = await Promise.all([
      Car.find({ userId: ownerId }),
      Booking.find({ ownerId }),
    ]);
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    res.json({
      totalCars: cars.length,
      activeCars: cars.filter(c => c.available).length,
      totalBookings: bookings.length,
      pendingRequests: pendingBookings.length,
      totalEarnings,
      monthlyEarnings: completedBookings
        .filter(b => {
          const d = new Date(b.endDate);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
    });
  } catch (error) {
    console.error('Error fetching host stats:', error);
    res.status(500).json({ message: 'Error fetching host stats' });
  }
});

// Start the server (local dev only)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;



// Update car price route
app.put('/api/cars/:carId', authenticate, async (req, res) => {
  try {
    const { price } = req.body;
    const car = await Car.findByIdAndUpdate(req.params.carId, { price }, { new: true });
    res.json(car);
  } catch (error) {
    console.error('Error updating car price:', error);
    res.status(500).send('Error updating car price');
  }
});
