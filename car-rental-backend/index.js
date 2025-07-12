const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('./models/User'); // Import the User model
const carRoutes = require('./routes/car'); // Import car routes

const app = express();
const port = 5001; // Port number

const secretKey = 'your_secret_key'; // Should be stored in environment variables

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/carRental', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

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
    console.error('Error registering user:', error);
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
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
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

// Use routes
app.use('/api', carRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
