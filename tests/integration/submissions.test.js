const request = require('supertest');
const app = require('../../server');
const helpers = require('../helpers');

describe('Writing Submissions Endpoints', () => {
  let student;
  let instructor;
  let studentToken;
  let instructorToken;
  let submission;

  beforeEach(async () => {
    await helpers.cleanDatabase();

    // Create test users
    student = await helpers.createUser(helpers.mockUserData.student);
    instructor = await helpers.createUser(helpers.mockUserData.instructor);

    // Generate auth tokens
    studentToken = helpers.getAuthToken(student.id, 'student');
    instructorToken = helpers.getAuthToken(instructor.id, 'instructor');

    // Create a test submission
    submission = await helpers.createSubmission({
      user_id: student.id,
      title: 'Test Writing Submission',
      content: 'This is a test writing submission content.',
      status: 'pending'
    });
  });

  describe('POST /api/submissions', () => {
    const newSubmission = {
      title: 'My Writing Submission',
      content: 'This is my writing submission content for review.',
      file_url: 'https://example.com/submission.pdf'
    };

    it('should create a new submission for authenticated user', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSubmission);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newSubmission.title);
      expect(response.body.status).toBe('pending');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'title',
          message: expect.any(String)
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send(newSubmission);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/submissions', () => {
    it('should list user\'s submissions', async () => {
      const response = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id', submission.id);
    });

    it('should filter submissions by status', async () => {
      const response = await request(app)
        .get('/api/submissions')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('pending');
    });
  });

  describe('GET /api/submissions/:id', () => {
    it('should get submission details', async () => {
      const response = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', submission.id);
      expect(response.body).toHaveProperty('content');
    });

    it('should not allow access to other users\' submissions', async () => {
      const otherStudent = await helpers.createUser({
        email: 'other@example.com',
        role: 'student'
      });
      const otherToken = helpers.getAuthToken(otherStudent.id);

      const response = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/submissions/:id/review', () => {
    const review = {
      feedback: 'Great work! Here are some suggestions for improvement...',
      score: 850,
      corrections: [
        'Improve paragraph structure',
        'Add more supporting evidence'
      ]
    };

    it('should allow instructor to review submission', async () => {
      const response = await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(review);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('score', review.score);
      expect(response.body).toHaveProperty('feedback', review.feedback);
    });

    it('should not allow students to review submissions', async () => {
      const response = await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(review);

      expect(response.status).toBe(403);
    });

    it('should validate review data', async () => {
      const response = await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          score: 1100 // Invalid score > 1000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should not allow reviewing already reviewed submissions', async () => {
      // First review
      await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(review);

      // Second review attempt
      const response = await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(review);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already reviewed');
    });
  });

  describe('GET /api/submissions/stats', () => {
    it('should return user submission statistics', async () => {
      // Create some reviewed submissions
      await helpers.createSubmission({
        user_id: student.id,
        status: 'completed',
        score: 900
      });
      await helpers.createSubmission({
        user_id: student.id,
        status: 'completed',
        score: 850
      });

      const response = await request(app)
        .get('/api/submissions/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_submissions');
      expect(response.body).toHaveProperty('reviewed_submissions');
      expect(response.body).toHaveProperty('average_score');
      expect(response.body).toHaveProperty('highest_score');
    });
  });
});
