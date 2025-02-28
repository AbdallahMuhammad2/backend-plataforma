const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get user profile
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await UserController.findById(req.user.id);
  delete user.passwordHash;
  res.json(user);
}));

// Update user profile
router.patch('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await UserController.updateProfile(req.user.id, req.body);
  res.json(user);
}));

// Get user stats
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const stats = await UserController.getUserStats(req.user.id);
  res.json(stats);
}));

// Get all user achievements
router.get('/achievements', authMiddleware, asyncHandler(async (req, res) => {
  const achievements = await UserController.getUserAchievements(req.user.id);
  res.json(achievements);
}));

// Get recent achievements
router.get('/achievements/recent', authMiddleware, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const achievements = await UserController.getRecentAchievements(req.user.id, limit);
  res.json(achievements);
}));

module.exports = router;
