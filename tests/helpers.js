const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./setup');

const helpers = {
  // User helpers
  async createUser(userData = {}) {
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      bio: 'Test user bio',
      avatar_url: 'https://example.com/avatar.jpg'
    };

    const user = { ...defaultUser, ...userData };
    const passwordHash = await bcrypt.hash(user.password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, passwordHash, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.name, user.email, passwordHash, user.bio, user.avatar_url]
    );

    return result.rows[0];
  },

  // Course helpers
  async createCourse(courseData = {}) {
    const defaultCourse = {
      title: 'Test Course',
      description: 'Test course description',
      thumbnail_url: 'https://example.com/thumb.jpg',
      level: 'Intermediário',
      category: 'ENEM',
      total_hours: 40
    };

    const course = { ...defaultCourse, ...courseData };
    const result = await pool.query(
      `INSERT INTO courses (title, description, thumbnail_url, level, category, total_hours, instructor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [course.title, course.description, course.thumbnail_url, course.level, 
       course.category, course.total_hours, course.instructor_id]
    );

    return result.rows[0];
  },

  // Module helpers
  async createModule(moduleData = {}) {
    const defaultModule = {
      title: 'Test Module',
      description: 'Test module description',
      order_index: 1
    };

    const module = { ...defaultModule, ...moduleData };
    const result = await pool.query(
      `INSERT INTO modules (course_id, title, description, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [module.course_id, module.title, module.description, module.order_index]
    );

    return result.rows[0];
  },

  // Lesson helpers
  async createLesson(lessonData = {}) {
    const defaultLesson = {
      title: 'Test Lesson',
      description: 'Test lesson description',
      video_url: 'https://example.com/video.mp4',
      duration: 30,
      order_index: 1
    };

    const lesson = { ...defaultLesson, ...lessonData };
    const result = await pool.query(
      `INSERT INTO lessons (module_id, title, description, video_url, duration, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [lesson.module_id, lesson.title, lesson.description, lesson.video_url,
       lesson.duration, lesson.order_index]
    );

    return result.rows[0];
  },

  // Writing submission helpers
  async createSubmission(submissionData = {}) {
    const defaultSubmission = {
      title: 'Test Submission',
      content: 'Test submission content',
      status: 'pending'
    };

    const submission = { ...defaultSubmission, ...submissionData };
    const result = await pool.query(
      `INSERT INTO writing_submissions (user_id, title, content, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [submission.user_id, submission.title, submission.content, submission.status]
    );

    return result.rows[0];
  },

  // Authentication helpers
  getAuthToken(userId, role = 'user') {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  // Database cleanup helpers
  async cleanDatabase() {
    await pool.query(`
      TRUNCATE users, courses, modules, lessons, materials,
      writing_submissions, achievements, user_achievements,
      study_notes, user_progress CASCADE
    `);
  },

  // Test data generators
  generateRandomEmail() {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  },

  generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Mock data
  mockCourseData: {
    basic: {
      title: 'Basic Writing Course',
      description: 'Learn the basics of writing',
      level: 'Iniciante',
      category: 'ENEM',
      total_hours: 20
    },
    advanced: {
      title: 'Advanced Writing Course',
      description: 'Master advanced writing techniques',
      level: 'Avançado',
      category: 'Concursos',
      total_hours: 40
    }
  },

  mockUserData: {
    student: {
      name: 'Student User',
      email: 'student@example.com',
      password: 'Student123!',
      role: 'student'
    },
    instructor: {
      name: 'Instructor User',
      email: 'instructor@example.com',
      password: 'Instructor123!',
      role: 'instructor'
    },
    admin: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin'
    }
  }
};

module.exports = helpers;
