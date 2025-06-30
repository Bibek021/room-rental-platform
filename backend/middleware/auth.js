const jwt = require('jsonwebtoken');

// Authenticate JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user ID and role to request
    next();
  } catch (err) {
    console.error('JWT error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Restrict by role
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { authMiddleware, restrictTo };