const { jwtSecret: secretKey, mongoUrl, port: configPort } = require('./config');
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
const port = configPort;

// ─── Rate limiter (in-process — good enough for single-instance deploys) ──────
const rateLimitMap = new Map();
function rateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const requests = (rateLimitMap.get(key) || []).filter(t => t > now - windowMs);
    if (requests.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many attempts. Please wait and try again.' });
    }
    requests.push(now);
    rateLimitMap.set(key, requests);
    next();
  };
}
const authLimiter = rateLimit(20, 15 * 60 * 1000); // 20 per 15 minutes

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin), listed origins, and all vercel.app previews
    if (
      !origin ||
      allowedOrigins.some(o => origin.startsWith(o)) ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true,
}));
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
  await mongoose.connect(mongoUrl, {
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
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const settings = await AppSettings.findOne() || new AppSettings();
    if (!settings.registrationOpen) {
      return res.status(403).json({ message: 'Registration is currently closed' });
    }
    const { username, password, building, buildingId, firstName, lastName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      approved: false,
      building: building || '',
      buildingId: buildingId || '',
      firstName: firstName || '',
      lastName: lastName || '',
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Route to handle user login
app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      if (user.paused === true) {
        return res.status(401).send('Your account has been suspended. Please contact support.');
      }
      const token = jwt.sign({ userId: user._id, username: user.username, isVerified: user.isVerified && user.approved, role: user.role || 'user' }, secretKey, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '7d' });
      res.json({ token, refreshToken });
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
      // approved stays as-is — admin will set it after reviewing the document
    });
    res.json({ message: 'Document submitted. Pending admin review.' });
  } catch (error) {
    console.error('Error submitting verification data:', error);
    res.status(500).send('Error submitting verification data');
  }
});

// Refresh access token using a long-lived refresh token
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const user = await User.findById(decoded.userId).select('username isVerified role approved');
    if (!user || user.paused === true) return res.status(401).json({ message: 'Unauthorized' });
    const token = jwt.sign(
      { userId: user._id, username: user.username, isVerified: user.isVerified && user.approved, role: user.role || 'user' },
      secretKey,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// Check approval status (used by pending page to poll)
app.get('/api/auth/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('approved isVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ approved: user.approved, isVerified: user.isVerified });
  } catch (error) {
    res.status(500).json({ message: 'Error checking status' });
  }
});

// Route to fetch user verification data (exclude the raw base64 document from response)
app.get('/api/verification/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('verificationData');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Return metadata only — not the raw base64 document string
    const { verificationDocument, ...meta } = user.verificationData?.toObject?.() ?? user.verificationData ?? {};
    res.json({ ...meta, hasDocument: !!verificationDocument });
  } catch (error) {
    console.error('Error fetching verification data:', error);
    res.status(500).json({ message: 'Error fetching verification data' });
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

// GET /api/vin/:vin — decode a VIN via NHTSA public API (no auth required)
app.get('/api/vin/:vin', async (req, res) => {
  const { vin } = req.params;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return res.status(400).json({ message: 'VIN must be exactly 17 characters (letters and numbers, no I/O/Q).' });
  }
  try {
    const nhtsaRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin.toUpperCase()}?format=json`
    );
    if (!nhtsaRes.ok) throw new Error('NHTSA API error');
    const data = await nhtsaRes.json();
    const results = data.Results || [];

    const get = (variable) => {
      const item = results.find(r => r.Variable === variable);
      return item && item.Value && item.Value !== 'Not Applicable' && item.Value !== 'null' ? item.Value : null;
    };

    const makeRaw = get('Make');
    const modelRaw = get('Model');
    const yearRaw  = get('Model Year');

    if (!makeRaw || !modelRaw || !yearRaw) {
      return res.status(404).json({ message: 'Vehicle not found — double-check your VIN and try again.' });
    }

    // Capitalize make (HONDA → Honda)
    const make = makeRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    // Fuel type mapping
    const fuelRaw = (get('Fuel Type - Primary') || '').toLowerCase();
    let type = 'Gas';
    if (fuelRaw.includes('electric')) type = 'Electric';
    else if (fuelRaw.includes('hybrid')) type = 'Hybrid';
    else if (fuelRaw.includes('diesel')) type = 'Diesel';

    // Transmission mapping
    const transRaw = (get('Transmission Style') || '').toLowerCase();
    let transmission = 'Automatic';
    if (transRaw.includes('manual')) transmission = 'Manual';
    else if (transRaw.includes('continuously variable') || transRaw.includes('cvt')) transmission = 'CVT';

    // Seats
    const seatsRaw = get('Number of Seats (total)') || get('Seating Rows') || '5';
    const seats = Math.max(2, Math.min(8, parseInt(seatsRaw) || 5));

    res.json({
      make,
      model: modelRaw,
      year: parseInt(yearRaw),
      type,
      transmission,
      seats,
      vehicleType: get('Vehicle Type') || '',
      trim: get('Trim') || '',
    });
  } catch (err) {
    console.error('VIN decode error:', err);
    res.status(500).json({ message: 'VIN lookup failed — please try again or enter details manually.' });
  }
});

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
