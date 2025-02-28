const request = require('supertest');
const app = require('../../server');
const helpers = require('../helpers');
const bcrypt = require('bcryptjs');

describe('User Management', () => {
  let user;
  let token;

  beforeEach(async () => {
    await helpers.cleanDatabase();
    user = await helpers.createUser(helpers.mockUserData.student);
    token = helpers.getAuthToken(user.id);
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', user.id);
      expect(response.body).toHaveProperty('email', user.email);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should include user stats', async () => {
      // Create some user activity
      await helpers.createSubmission({ user_id: user.id });
      await helpers.createCourseProgress(user.id);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('submissions_count');
      expect(response.body.stats).toHaveProperty('courses_progress');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
        bio: 'Updated bio',
        phone: '11999999999'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.bio).toBe(updates.bio);
    });

    it('should validate email format when updating', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email'
        })
      );
    });

    it('should prevent email duplication', async () => {
      // Create another user
      await helpers.createUser({
        email: 'other@example.com'
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'other@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already taken');
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change user password', async () => {
      const passwordData = {
        currentPassword: helpers.mockUserData.student.password,
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(200);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: passwordData.newPassword
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should require current password', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: helpers.mockUserData.student.password,
          newPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'newPassword'
        })
      );
    });
  });

  describe('GET /api/users/progress', () => {
    it('should get user learning progress', async () => {
      // Create course progress
      const course = await helpers.createCourse();
      const module = await helpers.createModule({ course_id: course.id });
      const lesson = await helpers.createLesson({ module_id: module.id });
      await helpers.markLessonComplete(user.id, lesson.id);

      const response = await request(app)
        .get('/api/users/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('courses');
      expect(response.body.courses[0]).toHaveProperty('progress_percentage');
      expect(response.body).toHaveProperty('total_hours_studied');
    });

    it('should include submission statistics', async () => {
      // Create some submissions
      await helpers.createSubmission({
        user_id: user.id,
        status: 'completed',
        score: 900
      });

      const response = await request(app)
        .get('/api/users/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('submissions');
      expect(response.body.submissions).toHaveProperty('total_submissions');
      expect(response.body.submissions).toHaveProperty('average_score');
    });
  });

  describe('GET /api/users/preferences', () => {
    it('should get user preferences', async () => {
      const response = await request(app)
        .get('/api/users/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email_notifications');
      expect(response.body).toHaveProperty('language');
    });
  });

  describe('PUT /api/users/preferences', () => {
    it('should update user preferences', async () => {
      const preferences = {
        email_notifications: {
          achievements: false,
          submissions: true
        },
        language: 'pt-BR'
      };

      const response = await request(app)
        .put('/api/users/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body.email_notifications).toEqual(preferences.email_notifications);
      expect(response.body.language).toBe(preferences.language);
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete user account', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: helpers.mockUserData.student.password });

      expect(response.status).toBe(200);

      // Verify account is deleted
      const loginAttempt = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: helpers.mockUserData.student.password
        });

      expect(loginAttempt.status).toBe(401);
    });

    it('should require password confirmation', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });
  });
});
