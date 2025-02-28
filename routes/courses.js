const express = require('express'); 
const router = express.Router(); // Removed duplicate router initialization

const CourseController = require('../controllers/CourseController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

console.log('Courses route initialized'); // Logging for route initialization
// Get all courses with progress

router.get('/', authMiddleware, asyncHandler(async (req, res) => { 
  console.log(`Request to get all courses by user ID: ${req.user.id}`); // Logging for request

  const courses = await CourseController.getAllCourses(req.user.id); 
  console.log(`Fetched ${courses.length} courses`); // Logging for fetched courses

  res.json(courses);
}));

// Get specific course with modules and lessons
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => { 
  console.log(`Request to get course with ID: ${req.params.id}`); // Logging for request

  const course = await CourseController.getCourse(req.params.id, req.user.id); 
  console.log(`Fetched course: ${JSON.stringify(course)}`); // Logging for fetched course

  res.json(course);
}));

// Get course progress
router.get('/:id/progress', authMiddleware, asyncHandler(async (req, res) => { 
  console.log(`Request to get progress for course ID: ${req.params.id}`); // Logging for request

  const progress = await CourseController.getCourseProgress(req.params.id, req.user.id); 
  console.log(`Fetched progress for course ID: ${req.params.id}`); // Logging for fetched progress

  res.json(progress);
}));

// Mark lesson as complete
router.post('/lessons/:id/complete', authMiddleware, asyncHandler(async (req, res) => { 
  console.log(`Request to mark lesson ID: ${req.params.id} as complete for user ID: ${req.user.id}`); // Logging for request

  const result = await CourseController.markLessonComplete(req.params.id, req.user.id); 
  console.log(`Marked lesson ID: ${req.params.id} as complete`); // Logging for marking lesson

  res.json(result);
}));

module.exports = router;
