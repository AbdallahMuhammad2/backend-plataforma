const CourseController = require('../controllers/CourseController');

describe('CourseController', () => {
  it('should fetch course details by ID', async () => {
    const courseId = 1; // Example course ID
    const userId = 1; // Example user ID
    const course = await CourseController.getCourse(courseId, userId);
    
    expect(course).toHaveProperty('id', courseId);
    expect(course).toHaveProperty('title');
    expect(course).toHaveProperty('description');
  });

  it('should throw an error for a non-existent course', async () => {
    const courseId = 999; // Non-existent course ID
    const userId = 1; // Example user ID

    await expect(CourseController.getCourse(courseId, userId)).rejects.toThrow('Course not found');
  });
});
