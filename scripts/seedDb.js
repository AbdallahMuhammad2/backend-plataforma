require('dotenv').config(); // Load environment variables
require('dotenv').config({ path: './backend/.env.production' }); // Load environment variables
const { sequelize } = require('../config/database');

console.log('Database User:', process.env.DB_USER);
console.log('Database Name:', process.env.DB_NAME);
console.log('Database Password:', process.env.DB_PASSWORD);
console.log('Database Host:', process.env.DB_HOST);
console.log('Database Port:', process.env.DB_PORT);

const { Achievement, Course } = require('../models'); // Import from the db object
const { User } = require('../models'); // Updated import to match the index.js structure


async function seedDatabase() {
  try {
    await sequelize.sync();

    // Create a sample user
    const [user] = await User.findOrCreate({
      where: { email: 'sampleuser@example.com' }, // Ensure this is appropriate for production

      where: { email: 'sampleuser@example.com' },
      defaults: {
        name: 'Sample User',
        passwordHash: 'your_production_password_hash', // Update to a secure password hash for production

      },
    });

    // Seed Achievements
    const achievements = [ // Ensure these achievements are relevant for production

      {
        title: 'Assistiu à Primeira Aula',
        description: 'Concedido por assistir à primeira aula.',
        criteria: 'watched_lesson',
        points: 10,
        userId: user.id, // Associate with the sample user
      },
      {
        title: 'Curso Completo',
        description: 'Concedido por completar um curso.',
        criteria: 'course_completed',
        points: 50,
        userId: user.id, // Associate with the sample user
      },
    ];

    for (const achievement of achievements) {
      await Achievement.findOrCreate({
        where: { title: achievement.title },
        defaults: achievement,
      });
    }

    // Seed Courses
    const courses = [ // Ensure these courses are relevant for production

      {
        title: 'Introdução à Programação',
        description: 'Aprenda os conceitos básicos de programação.',
        category: 'Programação',
        level: 'Iniciante',
        thumbnail_url: 'thumbnail1.jpg',
        video_url: 'video1.mp4',
        duration: 3600,
        video_title: 'Vídeo de Introdução',
        instructor_id: user.id, // Associate with the sample user

      },
      {
        title: 'JavaScript Avançado',
        description: 'Aprofunde-se no JavaScript.',
        category: 'Programação',
        level: 'Avançado',
        thumbnail_url: 'thumbnail2.jpg',
        video_url: 'video2.mp4',
        duration: 7200,
        video_title: 'Vídeo Avançado',
        instructor_id: user.id, // Associate with the sample user

      },
    ];

    for (const course of courses) {
      await Course.findOrCreate({
        where: { title: course.title },
        defaults: course,
      });
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
