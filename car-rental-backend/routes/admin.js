const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const AppSettings = require('../models/AppSettings');
const Building = require('../models/Building');

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

// ─── Middleware ────────────────────────────────────────────────────────────────

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

router.get('/admin/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [users, totalListings, bookings] = await Promise.all([
      User.find(),
      Car.countDocuments(),
      Booking.find(),
    ]);

    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.paused).length;
    const pausedUsers = users.filter(u => u.paused).length;
    const pendingVerifications = users.filter(u => !u.isVerified && u.verificationData && u.verificationData.verificationDocument).length;
    const newUsersThisMonth = users.filter(u => u.createdAt && u.createdAt >= startOfMonth).length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const buildingSet = new Set();
    users.forEach(u => {
      if (u.building && u.building.trim() !== '') {
        buildingSet.add(u.building.trim());
      }
    });
    const buildings = Array.from(buildingSet);

    res.json({
      totalUsers,
      totalListings,
      totalBookings,
      totalRevenue,
      activeUsers,
      pausedUsers,
      pendingVerifications,
      newUsersThisMonth,
      buildings,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

// ─── Activity ──────────────────────────────────────────────────────────────────

router.get('/admin/activity', authenticate, adminOnly, async (req, res) => {
  try {
    const [recentUsers, recentBookings, recentListings] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(20),
      Booking.find().populate('renterId', 'username').sort({ createdAt: -1 }).limit(20),
      Car.find().populate('userId', 'username').sort({ createdAt: -1 }).limit(20),
    ]);

    const userEvents = recentUsers.map(u => ({
      type: 'new_user',
      description: 'New user registered',
      user: u.username,
      date: u.createdAt,
    }));

    const bookingEvents = recentBookings.map(b => ({
      type: 'booking',
      description: 'New booking created',
      user: b.renterId ? b.renterId.username : null,
      date: b.createdAt,
    }));

    const listingEvents = recentListings.map(c => ({
      type: 'listing',
      description: 'New car listed',
      user: c.userId ? c.userId.username : null,
      date: c.createdAt,
    }));

    const all = [...userEvents, ...bookingEvents, ...listingEvents];
    all.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(all.slice(0, 50));
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    res.status(500).json({ message: 'Error fetching admin activity' });
  }
});

// ─── Users list ────────────────────────────────────────────────────────────────

router.get('/admin/users', authenticate, adminOnly, async (req, res) => {
  try {
    const { search, building, status } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    if (building) {
      filter.building = new RegExp(building, 'i');
    }

    if (status === 'active') {
      filter.paused = false;
      filter.isVerified = true;
    } else if (status === 'paused') {
      filter.paused = true;
    } else if (status === 'unverified') {
      filter.isVerified = false;
    } else if (status === 'admin') {
      filter.role = 'admin';
    }

    const users = await User.find(filter).select('-password -verificationData');

    const carCounts = await Car.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const carCountMap = {};
    carCounts.forEach(entry => {
      carCountMap[entry._id.toString()] = entry.count;
    });

    const usersWithCarCount = users.map(u => {
      const obj = u.toObject();
      obj.carCount = carCountMap[u._id.toString()] || 0;
      return obj;
    });

    res.json(usersWithCarCount);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ─── Single user ───────────────────────────────────────────────────────────────

router.get('/admin/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [cars, bookingCount] = await Promise.all([
      Car.find({ userId: req.params.id }),
      Booking.countDocuments({ renterId: req.params.id }),
    ]);

    const result = user.toObject();
    result.cars = cars;
    result.bookingCount = bookingCount;

    res.json(result);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// ─── Update user ───────────────────────────────────────────────────────────────

router.put('/admin/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { paused, role, building, firstName, lastName } = req.body;
    const updates = {};
    if (paused !== undefined) updates.paused = paused;
    if (role !== undefined) updates.role = role;
    if (building !== undefined) updates.building = building;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// ─── Delete user ───────────────────────────────────────────────────────────────

router.delete('/admin/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    await Promise.all([
      User.findByIdAndDelete(userId),
      Car.deleteMany({ userId }),
      Booking.deleteMany({ $or: [{ renterId: userId }, { ownerId: userId }] }),
    ]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// ─── Reset password ────────────────────────────────────────────────────────────

router.put('/admin/users/:id/reset-password', authenticate, adminOnly, async (req, res) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tempPassword = '';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ tempPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// ─── Listings ──────────────────────────────────────────────────────────────────

router.get('/admin/listings', authenticate, adminOnly, async (req, res) => {
  try {
    const { search, available } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { make: regex },
        { model: regex },
        { licensePlate: regex },
      ];
    }

    if (available === 'true') {
      filter.available = true;
    } else if (available === 'false') {
      filter.available = false;
    }

    const cars = await Car.find(filter).populate('userId', 'firstName lastName username building');
    res.json(cars);
  } catch (error) {
    console.error('Error fetching admin listings:', error);
    res.status(500).json({ message: 'Error fetching listings' });
  }
});

// ─── Update listing ────────────────────────────────────────────────────────────

router.put('/admin/listings/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { available } = req.body;
    const updates = {};
    if (available !== undefined) updates.available = available;

    const car = await Car.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!car) return res.status(404).json({ message: 'Listing not found' });

    res.json(car);
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ message: 'Error updating listing' });
  }
});

// ─── Delete listing ────────────────────────────────────────────────────────────

router.delete('/admin/listings/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ message: 'Listing not found' });

    res.json({ message: 'Listing deleted' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ message: 'Error deleting listing' });
  }
});

// ─── Bookings ──────────────────────────────────────────────────────────────────

router.get('/admin/bookings', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('renterId', 'firstName lastName username')
      .populate('ownerId', 'username')
      .populate('carId', 'make model year');

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// ─── App Settings ──────────────────────────────────────────────────────────────

router.get('/admin/settings', authenticate, adminOnly, async (req, res) => {
  try {
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.put('/admin/settings', authenticate, adminOnly, async (req, res) => {
  try {
    const { registrationOpen, requireApproval } = req.body;
    const updates = {};
    if (registrationOpen !== undefined) updates.registrationOpen = registrationOpen;
    if (requireApproval !== undefined) updates.requireApproval = requireApproval;

    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create(updates);
    } else {
      settings = await AppSettings.findByIdAndUpdate(settings._id, updates, { new: true });
    }
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// ─── Pending Users ─────────────────────────────────────────────────────────────

router.get('/admin/pending-users', authenticate, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ approved: false }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Error fetching pending users' });
  }
});

router.put('/admin/users/:id/approve', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approved: true, isVerified: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Error approving user' });
  }
});

// ─── Online Users ──────────────────────────────────────────────────────────────

router.get('/admin/online-users', authenticate, adminOnly, async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await User.find({ lastSeen: { $gt: fiveMinutesAgo } })
      .select('_id username lastSeen role');
    res.json(users);
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ message: 'Error fetching online users' });
  }
});

// ─── Buildings ─────────────────────────────────────────────────────────────────

router.get('/admin/buildings', authenticate, adminOnly, async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: -1 });
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buildings' });
  }
});

router.post('/admin/buildings', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, address } = req.body;
    const building = await Building.create({ name, address });
    res.status(201).json(building);
  } catch (error) {
    res.status(500).json({ message: 'Error creating building' });
  }
});

router.put('/admin/buildings/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!building) return res.status(404).json({ message: 'Building not found' });
    res.json(building);
  } catch (error) {
    res.status(500).json({ message: 'Error updating building' });
  }
});

router.delete('/admin/buildings/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await Building.findByIdAndDelete(req.params.id);
    res.json({ message: 'Building deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting building' });
  }
});

// ─── Promote to admin (first-run, no adminOnly) ────────────────────────────────

router.post('/admin/promote', authenticate, async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(403).json({ message: 'An admin already exists. Self-promotion is not allowed.' });
    }

    await User.findByIdAndUpdate(req.user.userId, { role: 'admin' });
    res.json({ message: 'Promoted to admin' });
  } catch (error) {
    console.error('Error promoting to admin:', error);
    res.status(500).json({ message: 'Error promoting to admin' });
  }
});

module.exports = router;
