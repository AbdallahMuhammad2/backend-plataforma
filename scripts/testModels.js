require('dotenv').config();
const { sequelize } = require('../config/database');
const Achievement = require('../models/achievement');
const Course = require('../models/course');
const User = require('../models/user')(sequelize, require('sequelize').DataTypes);

// Log the entire process.env object
console.log('Environment Variables:', process.env);

async function testModels() {
  try {
    await sequelize.sync({ force: true }); // Reset the database for testing

    // Test User model
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      passwordHash: 'hashedpassword',
    });
    console.log('User created:', user.toJSON());

    // Test Achievement model
    const achievement = await Achievement.create({
      title: 'Test Achievement',
      description: 'This is a test achievement.',
      criteria: 'test_criteria',
      points: 10,
      userId: user.id,
    });
    console.log('Achievement created:', achievement.toJSON());

    // Test Course model
    const course = await Course.create({
      title: 'Test Course',
      description: 'This is a test course.',
      category: 'Test Category',
      level: 'Iniciante',
      thumbnail_url: 'test_thumbnail.jpg',
      video_url: 'test_video.mp4',
      duration: 3600,
      video_title: 'Test Video',
    });
    console.log('Course created:', course.toJSON());

  } catch (error) {
    console.error('Error testing models:', error);
  } finally {
    await sequelize.close();
  }
}

testModels();
