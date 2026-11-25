const jwt   = require('jsonwebtoken');
const User  = require('../models/User');
const Admin = require('../models/Admin');

// ─── Verify JWT and attach req.user ───────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let record;
    if (decoded.userType === 'admin') {
      record = await Admin.findByIdSafe(decoded.userId);
    } else {
      record = await User.findByIdSafe(decoded.userId);
    }

    if (!record) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    if (decoded.userType !== 'admin' && record.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator.',
        blocked: true
      });
    }

    req.user = {
      id:       record.id,
      email:    record.email,
      role:     decoded.userType === 'admin' ? 'admin' : 'user',
      userType: decoded.userType || 'user'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error:   error.message
    });
  }
};

// ─── Require admin role ───────────────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = { authenticate, isAdmin };
