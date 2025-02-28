const request = require('supertest');
const app = require('../../server');
const helpers = require('../helpers');
const emailService = require('../../services/emailService');

// Mock the nodemailer transporter
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id'
    })
  })
}));

describe('Email Notifications', () => {
  let student;
  let instructor;
  let studentToken;
  let submission;

  beforeEach(async () => {
    await helpers.cleanDatabase();
    
    // Create test users
    student = await helpers.createUser(helpers.mockUserData.student);
    instructor = await helpers.createUser(helpers.mockUserData.instructor);
    studentToken = helpers.getAuthToken(student.id, 'student');

    // Reset email service mocks
    jest.clearAllMocks();
  });

  describe('Welcome Email', () => {
    it('should send welcome email on registration', async () => {
      const spy = jest.spyOn(emailService, 'sendWelcomeEmail');
      
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toHaveProperty('email', newUser.email);
    });

    it('should handle email sending failures gracefully', async () => {
      const spy = jest.spyOn(emailService, 'sendWelcomeEmail')
        .mockRejectedValue(new Error('Email sending failed'));

      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      // Registration should still succeed even if email fails
      expect(response.status).toBe(200);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Submission Notifications', () => {
    beforeEach(async () => {
      submission = await helpers.createSubmission({
        user_id: student.id,
        title: 'Test Submission',
        content: 'Test content',
        status: 'pending'
      });
    });

    it('should send confirmation email when submission is received', async () => {
      const spy = jest.spyOn(emailService, 'sendSubmissionReceivedEmail');

      const newSubmission = {
        title: 'New Submission',
        content: 'Test content'
      };

      await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSubmission);

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][1]).toHaveProperty('title', newSubmission.title);
    });

    it('should send notification when submission is reviewed', async () => {
      const spy = jest.spyOn(emailService, 'sendCorrectionCompletedEmail');
      const instructorToken = helpers.getAuthToken(instructor.id, 'instructor');

      await request(app)
        .post(`/api/submissions/${submission.id}/review`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          feedback: 'Great work!',
          score: 900
        });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][1]).toHaveProperty('score', 900);
    });
  });

  describe('Achievement Notifications', () => {
    it('should send email when achievement is unlocked', async () => {
      const spy = jest.spyOn(emailService, 'sendAchievementUnlockedEmail');

      // Trigger an achievement (e.g., first submission)
      await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'First Submission',
          content: 'Test content'
        });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'first_submission'
          })
        ])
      );
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const spy = jest.spyOn(emailService, 'sendPasswordResetEmail');

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: student.email });

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toHaveProperty('email', student.email);
      expect(spy.mock.calls[0][1]).toMatch(/^[\w-]+$/); // Reset token
    });

    it('should not reveal user existence through password reset', async () => {
      const spy = jest.spyOn(emailService, 'sendPasswordResetEmail');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200); // Should still return 200
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Email Templates', () => {
    it('should use correct template for welcome email', async () => {
      const spy = jest.spyOn(emailService, 'sendEmail');

      await emailService.sendWelcomeEmail({
        name: 'Test User',
        email: 'test@example.com'
      });

      const [emailData] = spy.mock.calls[0];
      expect(emailData.html).toContain('Bem-vindo');
      expect(emailData.html).toContain('Test User');
    });

    it('should use correct template for submission review', async () => {
      const spy = jest.spyOn(emailService, 'sendEmail');

      await emailService.sendCorrectionCompletedEmail(
        { name: 'Test User', email: 'test@example.com' },
        { title: 'Test Submission', score: 900, feedback: 'Great work!' }
      );

      const [emailData] = spy.mock.calls[0];
      expect(emailData.html).toContain('900');
      expect(emailData.html).toContain('Great work!');
    });
  });

  describe('Email Configuration', () => {
    it('should use correct email configuration', () => {
      expect(process.env.SMTP_HOST).toBeDefined();
      expect(process.env.SMTP_PORT).toBeDefined();
      expect(process.env.SMTP_USER).toBeDefined();
      expect(process.env.SMTP_PASS).toBeDefined();
      expect(process.env.EMAIL_FROM).toBeDefined();
    });
  });
});
