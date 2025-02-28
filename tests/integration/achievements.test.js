const request = require('supertest');
const app = require('../../server');
const helpers = require('../helpers');
const AchievementService = require('../../services/achievementService');

describe('Achievement System', () => {
  let student;
  let studentToken;
  let course;
  let module;
  let lesson;

  beforeEach(async () => {
    await helpers.cleanDatabase();

    // Create test users and content
    student = await helpers.createUser(helpers.mockUserData.student);
    studentToken = helpers.getAuthToken(student.id, 'student');

    // Create test course structure
    const instructor = await helpers.createUser(helpers.mockUserData.instructor);
    course = await helpers.createCourse({ instructor_id: instructor.id });
    module = await helpers.createModule({ course_id: course.id });
    lesson = await helpers.createLesson({ module_id: module.id });

    // Create test achievements
    await helpers.createAchievements();
  });

  describe('Achievement Triggers', () => {
    it('should award first submission achievement', async () => {
      const submission = {
        title: 'My First Writing',
        content: 'This is my first writing submission.'
      };

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submission);

      expect(response.status).toBe(201);

      // Check if achievement was awarded
      const achievements = await request(app)
        .get('/api/users/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(achievements.body).toContainEqual(
        expect.objectContaining({
          code: 'first_submission'
        })
      );
    });

    it('should award perfect score achievement', async () => {
      // Create a submission
      const submission = await helpers.createSubmission({
        user_id: student.id,
        status: 'pending'
      });

      // Review with perfect score
      const instructor = await helpers.createUser(helpers.mockUserData.instructor);
      const instructorToken = helpers.getAuthToken(instructor.id, 'instructor');

      await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          feedback: 'Perfect work!',
          score: 1000
        });

      // Check if achievement was awarded
      const achievements = await request(app)
        .get('/api/users/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(achievements.body).toContainEqual(
        expect.objectContaining({
          code: 'perfect_score'
        })
      );
    });

    it('should award course completion achievement', async () => {
      // Complete all lessons in the course
      await request(app)
        .post(`/api/courses/lessons/${lesson.id}/complete`)
        .set('Authorization', `Bearer ${studentToken}`);

      // Check if achievement was awarded
      const achievements = await request(app)
        .get('/api/users/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(achievements.body).toContainEqual(
        expect.objectContaining({
          code: 'course_completed'
        })
      );
    });

    it('should award study streak achievement', async () => {
      // Simulate daily activity for 7 days
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString();
      });

      for (const date of dates) {
        await helpers.createActivity(student.id, date);
      }

      // Trigger achievement check
      await AchievementService.checkAndGrantAchievements(student.id);

      // Check if achievement was awarded
      const achievements = await request(app)
        .get('/api/users/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(achievements.body).toContainEqual(
        expect.objectContaining({
          code: 'study_streak_7'
        })
      );
    });
  });

  describe('GET /api/users/achievements', () => {
    it('should list user achievements with unlock dates', async () => {
      // Grant some achievements
      await AchievementService.grantAchievement(student.id, 'first_submission');
      await AchievementService.grantAchievement(student.id, 'perfect_score');

      const response = await request(app)
        .get('/api/users/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('unlocked_at');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('description');
    });

    it('should return empty array for user with no achievements', async () => {
      const response = await request(app)
        .get('/api/users/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Achievement Progress', () => {
    it('should track progress towards achievements', async () => {
      const response = await request(app)
        .get('/api/users/achievements/progress')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('submissions_count');
      expect(response.body).toHaveProperty('highest_score');
      expect(response.body).toHaveProperty('completed_courses');
      expect(response.body).toHaveProperty('current_streak');
    });
  });

  describe('Achievement Notifications', () => {
    it('should include achievement data in relevant API responses', async () => {
      const submission = {
        title: 'Test Submission',
        content: 'Test content'
      };

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submission);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('achievements');
      expect(Array.isArray(response.body.achievements)).toBe(true);
    });
  });
});

// Helper function to create test achievements
async function createAchievements() {
  const achievements = [
    {
      code: 'first_submission',
      title: 'First Submission',
      description: 'Submit your first writing',
      icon: 'pencil'
    },
    {
      code: 'perfect_score',
      title: 'Perfect Score',
      description: 'Get a perfect 1000 score',
      icon: 'star'
    },
    {
      code: 'course_completed',
      title: 'Course Champion',
      description: 'Complete your first course',
      icon: 'trophy'
    },
    {
      code: 'study_streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day study streak',
      icon: 'flame'
    }
  ];

  for (const achievement of achievements) {
    await helpers.createAchievement(achievement);
  }
}
