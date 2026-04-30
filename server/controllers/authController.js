const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');
const {
  createSyncedWorker,
  deleteSyncedWorker,
  isValidEmail,
  normalizeEmail,
} = require('../services/workerSyncService');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT secret is not configured');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'Public signup is disabled. Ask an admin to create worker accounts.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/workers
 * @desc    List worker login accounts
 * @access  Private (Admin)
 */
const getWorkerAccounts = async (req, res, next) => {
  try {
    const workers = await Worker.find()
      .populate('userAccount', 'role')
      .sort({ createdAt: -1 });

    const workerAccounts = workers.map((worker) => {
      const data = worker.toObject();
      return {
        ...data,
        role: data.userAccount?.role || 'worker',
      };
    });

    res.json({ success: true, count: workerAccounts.length, workers: workerAccounts });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/workers
 * @desc    Create a worker login account
 * @access  Private (Admin)
 */
const createWorkerAccount = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const { worker, user } = await createSyncedWorker({ ...req.body, name, email, password });

    res.status(201).json({
      success: true,
      message: 'Worker account created successfully',
      worker,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/workers/:id
 * @desc    Delete a worker login account
 * @access  Private (Admin)
 */
const deleteWorkerAccount = async (req, res, next) => {
  try {
    const worker = await deleteSyncedWorker(req.params.id);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker account not found' });
    }

    res.json({ success: true, message: 'Worker account deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get logged-in user info
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, getWorkerAccounts, createWorkerAccount, deleteWorkerAccount };
