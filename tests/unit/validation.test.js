const { schemas } = require('../../middleware/validation');

describe('Validation Schemas', () => {
  describe('Auth Schemas', () => {
    describe('register schema', () => {
      it('should validate valid registration data', () => {
        const validData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          avatar_url: 'https://example.com/avatar.jpg',
          bio: 'Test bio'
        };

        const { error } = schemas.register.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require name', () => {
        const { error } = schemas.register.validate({
          email: 'test@example.com',
          password: 'Password123!'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('name');
      });

      it('should validate email format', () => {
        const { error } = schemas.register.validate({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('email');
      });

      it('should validate password length', () => {
        const { error } = schemas.register.validate({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
      });
    });

    describe('login schema', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123!'
        };

        const { error } = schemas.login.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require both email and password', () => {
        const { error } = schemas.login.validate({
          email: 'test@example.com'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
      });
    });
  });

  describe('User Schemas', () => {
    describe('updateProfile schema', () => {
      it('should validate valid profile updates', () => {
        const validData = {
          name: 'Updated Name',
          bio: 'Updated bio',
          avatar_url: 'https://example.com/new-avatar.jpg',
          phone: '+5511999999999'
        };

        const { error } = schemas.updateProfile.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate phone format', () => {
        const { error } = schemas.updateProfile.validate({
          phone: 'invalid-phone'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('phone');
      });

      it('should validate avatar URL', () => {
        const { error } = schemas.updateProfile.validate({
          avatar_url: 'invalid-url'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('avatar_url');
      });
    });

    describe('changePassword schema', () => {
      it('should validate valid password change', () => {
        const validData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        };

        const { error } = schemas.changePassword.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require both passwords', () => {
        const { error } = schemas.changePassword.validate({
          newPassword: 'NewPassword123!'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('currentPassword');
      });
    });
  });

  describe('Writing Submission Schemas', () => {
    describe('createSubmission schema', () => {
      it('should validate valid submission', () => {
        const validData = {
          title: 'Test Submission',
          content: 'This is a test submission with sufficient content length.',
          file_url: 'https://example.com/submission.pdf'
        };

        const { error } = schemas.createSubmission.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate content length', () => {
        const { error } = schemas.createSubmission.validate({
          title: 'Test',
          content: 'Too short'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('content');
      });

      it('should allow submission without file', () => {
        const validData = {
          title: 'Test Submission',
          content: 'This is a test submission with sufficient content length.'
        };

        const { error } = schemas.createSubmission.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('reviewSubmission schema', () => {
      it('should validate valid review', () => {
        const validData = {
          feedback: 'Great work on your submission!',
          score: 850,
          corrections: ['Improve paragraph structure', 'Add more examples']
        };

        const { error } = schemas.reviewSubmission.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate score range', () => {
        const { error } = schemas.reviewSubmission.validate({
          feedback: 'Good work',
          score: 1100 // Above maximum
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('score');
      });
    });
  });

  describe('Course Schemas', () => {
    describe('createCourse schema', () => {
      it('should validate valid course data', () => {
        const validData = {
          title: 'Test Course',
          description: 'Course description',
          thumbnail_url: 'https://example.com/thumb.jpg',
          level: 'Intermediário',
          category: 'ENEM',
          total_hours: 40
        };

        const { error } = schemas.createCourse.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate course level', () => {
        const { error } = schemas.createCourse.validate({
          title: 'Test Course',
          description: 'Description',
          level: 'Invalid Level'
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('level');
      });
    });

    describe('createModule schema', () => {
      it('should validate valid module data', () => {
        const validData = {
          title: 'Test Module',
          description: 'Module description',
          order_index: 1
        };

        const { error } = schemas.createModule.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should require non-negative order index', () => {
        const { error } = schemas.createModule.validate({
          title: 'Test Module',
          description: 'Description',
          order_index: -1
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('order_index');
      });
    });
  });
});
