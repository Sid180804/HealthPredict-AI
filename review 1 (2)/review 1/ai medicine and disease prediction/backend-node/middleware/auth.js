const jwt  = require('jsonwebtoken');
const db   = require('../db');
const { JWT_SECRET } = require('../config/constants');

/**
 * authenticate — verifies JWT and attaches req.user (password stripped).
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = db.users.get('users').find({ id: decoded.id }).value();
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * authorize(...roles) — role guard, must come after authenticate.
 * Usage: router.get('/admin', authenticate, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, authorize };
