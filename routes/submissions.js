const express = require('express');
const router = express.Router();
const WritingSubmissionController = require('../controllers/WritingSubmissionController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Submit a new writing
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const submission = await WritingSubmissionController.submitWriting({
    userId: req.user.id,
    ...req.body
  });
  res.json(submission);
}));

// Get user's submissions
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const submissions = await WritingSubmissionController.getUserSubmissions(
    req.user.id,
    req.query
  );
  res.json(submissions);
}));

// Get submission details
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const submission = await WritingSubmissionController.getSubmissionWithDetails(
    req.params.id,
    req.user.id
  );
  
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  
  res.json(submission);
}));

// Review a submission (instructors only)
router.post('/:id/review', [authMiddleware, authorize(['instructor', 'admin'])], asyncHandler(async (req, res) => {
  const submission = await WritingSubmissionController.reviewSubmission(
    req.params.id,
    {
      reviewerId: req.user.id,
      ...req.body
    }
  );
  res.json(submission);
}));

// Get submission statistics
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const stats = await WritingSubmissionController.getSubmissionStats(req.user.id);
  res.json(stats);
}));

// Get pending submissions (instructors only)
router.get('/pending', [authMiddleware, authorize(['instructor', 'admin'])], asyncHandler(async (req, res) => {
  const submissions = await WritingSubmissionController.getPendingSubmissions(req.query);
  res.json(submissions);
}));

// Update submission
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const submission = await WritingSubmissionController.getSubmissionWithDetails(
    req.params.id,
    req.user.id
  );
  
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  
  if (submission.status !== 'pending') {
    return res.status(400).json({ message: 'Cannot update reviewed submission' });
  }
  
  const updatedSubmission = await WritingSubmissionController.updateSubmission(
    req.params.id,
    req.body
  );
  
  res.json(updatedSubmission);
}));

// Delete submission
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const submission = await WritingSubmissionController.getSubmissionWithDetails(
    req.params.id,
    req.user.id
  );
  
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  
  if (submission.status !== 'pending') {
    return res.status(400).json({ message: 'Cannot delete reviewed submission' });
  }
  
  await WritingSubmissionController.delete(req.params.id);
  res.json({ message: 'Submission deleted successfully' });
}));

// Get submission feedback
router.get('/:id/feedback', authMiddleware, asyncHandler(async (req, res) => {
  const feedback = await WritingSubmissionController.getSubmissionFeedback(
    req.params.id,
    req.user.id
  );
  
  if (!feedback) {
    return res.status(404).json({ message: 'Feedback not found' });
  }
  
  res.json(feedback);
}));

// Get submission history
router.get('/history', authMiddleware, asyncHandler(async (req, res) => {
  const history = await WritingSubmissionController.getUserSubmissionHistory(
    req.user.id,
    req.query
  );
  res.json(history);
}));

module.exports = router;
