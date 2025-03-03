const UserController = require('../controllers/UserController');

function authMiddleware(req, res, next) {
  try {
    console.log('Auth middleware: Checking for token...'); // Log token check

    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware: Token found:', token); // Log the extracted token
    
    if (!token) {
      console.log('Auth middleware: No token found. Returning 401 error.');
      return res.redirect('/login');
    }

    console.log('Auth middleware: Verifying token...'); // Log token verification
    const decoded = UserController.verifyToken(token);
    console.log('Auth middleware: Token verified. Adding user data to request...', decoded); // Log user data addition

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware: Error verifying token:', error);
    res.status(401).json({ message: 'Invalid authentication token' });
  }
}

// Optional auth middleware - doesn't require auth but adds user data if token is present
function optionalAuth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = UserController.verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without user data if token is invalid
    next();
  }
}

// Role-based authorization middleware
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuth,
  authorize
};
