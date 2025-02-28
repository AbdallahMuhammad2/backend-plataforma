const request = require('supertest');
const app = require('../../server');
const helpers = require('../helpers');

describe('Course Endpoints', () => {
  let instructor;
  let student;
  let instructorToken;
  let studentToken;
  let course;

  beforeEach(async () => {
    await helpers.cleanDatabase();

    // Create test users
    instructor = await helpers.createUser(helpers.mockUserData.instructor);
    student = await helpers.createUser(helpers.mockUserData.student);

    // Generate auth tokens
    instructorToken = helpers.getAuthToken(instructor.id, 'instructor');
    studentToken = helpers.getAuthToken(student.id, 'student');

    // Create a test course
    course = await helpers.createCourse({
      ...helpers.mockCourseData.basic,
      instructor_id: instructor.id
    });
  });

  describe('GET /api/courses', () => {
    it('should list all courses', async () => {
      const response = await request(app)
        .get('/api/courses');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].title).toBe(course.title);
    });

    it('should filter courses by category', async () => {
      // Create another course with different category
      await helpers.createCourse({
        ...helpers.mockCourseData.advanced,
        instructor_id: instructor.id
      });

      const response = await request(app)
        .get('/api/courses')
        .query({ category: 'ENEM' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('ENEM');
    });

    it('should search courses by title', async () => {
      const response = await request(app)
        .get('/api/courses')
        .query({ search: 'Basic' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toContain('Basic');
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course details with modules and lessons', async () => {
      // Create module and lessons for the course
      const module = await helpers.createModule({
        course_id: course.id,
        title: 'Test Module'
      });

      await helpers.createLesson({
        module_id: module.id,
        title: 'Test Lesson'
      });

      const response = await request(app)
        .get(`/api/courses/${course.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', course.id);
      expect(response.body.modules).toHaveLength(1);
      expect(response.body.modules[0].lessons).toHaveLength(1);
    });

    it('should include user progress when authenticated', async () => {
      const response = await request(app)
        .get(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userProgress');
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/courses/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/courses', () => {
    const newCourse = {
      title: 'New Course',
      description: 'Course description',
      thumbnail_url: 'https://example.com/thumb.jpg',
      level: 'Intermediário',
      category: 'ENEM',
      total_hours: 30
    };

    it('should create a new course when instructor is authenticated', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newCourse.title);
    });

    it('should not allow students to create courses', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newCourse);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should update course details when instructor is authorized', async () => {
      const updates = {
        title: 'Updated Course Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updates.title);
    });

    it('should not allow unauthorized updates', async () => {
      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/courses/:id/modules', () => {
    const newModule = {
      title: 'New Module',
      description: 'Module description',
      order_index: 1
    };

    it('should add a module to the course', async () => {
      const response = await request(app)
        .post(`/api/courses/${course.id}/modules`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(newModule);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newModule.title);
    });
  });

  describe('POST /api/courses/lessons/:lessonId/complete', () => {
    let lesson;

    beforeEach(async () => {
      const module = await helpers.createModule({
        course_id: course.id
      });
      lesson = await helpers.createLesson({
        module_id: module.id
      });
    });

    it('should mark lesson as complete for authenticated user', async () => {
      const response = await request(app)
        .post(`/api/courses/lessons/${lesson.id}/complete`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('completed', true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/courses/lessons/${lesson.id}/complete`);

      expect(response.status).toBe(401);
    });
  });
});
