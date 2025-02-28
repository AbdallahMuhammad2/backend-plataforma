const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../server');
const helpers = require('../helpers');
const { fileUtils } = require('../../utils/helpers');

describe('File Upload', () => {
  let student;
  let instructor;
  let studentToken;
  let instructorToken;
  const testFilesDir = path.join(__dirname, '..', 'fixtures');
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

  beforeAll(async () => {
    // Create test files directory and sample files
    await fs.mkdir(testFilesDir, { recursive: true });
    await fs.writeFile(
      path.join(testFilesDir, 'test.pdf'),
      'Test PDF content'
    );
    await fs.writeFile(
      path.join(testFilesDir, 'test.doc'),
      'Test DOC content'
    );
    await fs.writeFile(
      path.join(testFilesDir, 'test.jpg'),
      'Test image content'
    );
  });

  beforeEach(async () => {
    await helpers.cleanDatabase();
    
    // Create test users
    student = await helpers.createUser(helpers.mockUserData.student);
    instructor = await helpers.createUser(helpers.mockUserData.instructor);
    
    studentToken = helpers.getAuthToken(student.id, 'student');
    instructorToken = helpers.getAuthToken(instructor.id, 'instructor');

    // Clear uploads directory
    await fs.rm(uploadsDir, { recursive: true, force: true });
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(path.join(uploadsDir, 'writings'), { recursive: true });
    await fs.mkdir(path.join(uploadsDir, 'avatars'), { recursive: true });
    await fs.mkdir(path.join(uploadsDir, 'materials'), { recursive: true });
  });

  afterAll(async () => {
    // Clean up test files
    await fs.rm(testFilesDir, { recursive: true, force: true });
    await fs.rm(uploadsDir, { recursive: true, force: true });
  });

  describe('Writing Submission Uploads', () => {
    it('should upload PDF file with writing submission', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Submission')
        .field('content', 'Test content')
        .attach('file', path.join(testFilesDir, 'test.pdf'));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('file_url');
      
      // Verify file exists
      const fileExists = await fileUtils.fileExists(
        path.join(uploadsDir, 'writings', path.basename(response.body.file_url))
      );
      expect(fileExists).toBe(true);
    });

    it('should reject non-allowed file types', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Submission')
        .field('content', 'Test content')
        .attach('file', path.join(testFilesDir, 'test.jpg'));

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('file type');
    });

    it('should handle large files', async () => {
      // Create a large file (6MB)
      const largePath = path.join(testFilesDir, 'large.pdf');
      const largeContent = Buffer.alloc(6 * 1024 * 1024, 'x');
      await fs.writeFile(largePath, largeContent);

      const response = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Submission')
        .field('content', 'Test content')
        .attach('file', largePath);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('file size');
    });
  });

  describe('Avatar Uploads', () => {
    it('should upload and update user avatar', async () => {
      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', path.join(testFilesDir, 'test.jpg'));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('avatar_url');

      // Verify avatar was updated in database
      const user = await helpers.findUserById(student.id);
      expect(user.avatar_url).toBe(response.body.avatar_url);
    });

    it('should remove old avatar when updating', async () => {
      // First upload
      const firstResponse = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', path.join(testFilesDir, 'test.jpg'));

      const firstAvatarPath = path.join(uploadsDir, 'avatars', 
        path.basename(firstResponse.body.avatar_url));

      // Second upload
      await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', path.join(testFilesDir, 'test.jpg'));

      // Verify old avatar was removed
      const oldAvatarExists = await fileUtils.fileExists(firstAvatarPath);
      expect(oldAvatarExists).toBe(false);
    });
  });

  describe('Course Materials Upload', () => {
    let course;

    beforeEach(async () => {
      course = await helpers.createCourse({
        instructor_id: instructor.id
      });
    });

    it('should upload course materials', async () => {
      const response = await request(app)
        .post(`/api/courses/${course.id}/materials`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .field('title', 'Course Material')
        .attach('material', path.join(testFilesDir, 'test.pdf'));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('url');
      
      // Verify file exists
      const fileExists = await fileUtils.fileExists(
        path.join(uploadsDir, 'materials', path.basename(response.body.url))
      );
      expect(fileExists).toBe(true);
    });

    it('should only allow instructors to upload materials', async () => {
      const response = await request(app)
        .post(`/api/courses/${course.id}/materials`)
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Course Material')
        .attach('material', path.join(testFilesDir, 'test.pdf'));

      expect(response.status).toBe(403);
    });
  });

  describe('File Cleanup', () => {
    it('should clean up files when submission is deleted', async () => {
      // Create submission with file
      const submission = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Submission')
        .field('content', 'Test content')
        .attach('file', path.join(testFilesDir, 'test.pdf'));

      const filePath = path.join(uploadsDir, 'writings', 
        path.basename(submission.body.file_url));

      // Delete submission
      await request(app)
        .delete(`/api/submissions/${submission.body.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      // Verify file was removed
      const fileExists = await fileUtils.fileExists(filePath);
      expect(fileExists).toBe(false);
    });
  });
});
