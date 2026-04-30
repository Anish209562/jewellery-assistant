const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies JWT and attaches user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT secret is not configured' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (without password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Role middleware — must be used after protect
 */
const authorizeRoles = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `${roles.join(' or ')} access required`,
  });
};

const adminOnly = authorizeRoles('admin');
const restrictTo = authorizeRoles;
const requireAuth = protect;
const requireAdmin = adminOnly;

module.exports = { protect, authorizeRoles, restrictTo, adminOnly, requireAuth, requireAdmin };
