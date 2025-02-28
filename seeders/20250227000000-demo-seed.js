'use strict';

const { User, Achievement, Course } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create a sample instructor
    const [instructor] = await User.findOrCreate({
      where: { email: 'instructor@example.com' },
      defaults: {
        name: 'Instructor Name',
        passwordHash: 'password123',
      },
    });

    // Create a sample user
    const [user] = await User.findOrCreate({
      where: { email: 'sampleuser@example.com' },
      defaults: {
        name: 'Sample User',
        passwordHash: 'password123',
      },
    });

    // Seed Achievements
    const achievements = [
      {
        title: 'Assistiu à Primeira Aula',
        description: 'Concedido por assistir à primeira aula.',
        criteria: 'watched_lesson',
        points: 10,
        userId: user.id,
      },
      {
        title: 'Curso Completo',
        description: 'Concedido por completar um curso.',
        criteria: 'course_completed',
        points: 50,
        userId: user.id,
      },
    ];

    for (const achievement of achievements) {
      await Achievement.findOrCreate({
        where: { title: achievement.title },
        defaults: achievement,
      });
    }

    // Seed Courses
    const courses = [
      {
        title: 'Introdução à Programação',
        description: 'Aprenda os conceitos básicos de programação.',
        category: 'Programação',
        level: 'Iniciante',
        thumbnail_url: 'thumbnail1.jpg',
        total_hours: 3600,
        instructor_id: instructor.id, // Associate with the sample instructor
      },
      {
        title: 'JavaScript Avançado',
        description: 'Aprofunde-se no JavaScript.',
        category: 'Programação',
        level: 'Avançado',
        thumbnail_url: 'thumbnail2.jpg',
        total_hours: 7200,
        instructor_id: instructor.id, // Associate with the sample instructor
      },
    ];

    for (const course of courses) {
      await Course.findOrCreate({
        where: { title: course.title },
        defaults: course,
      });
    }

    console.log('Database seeded successfully!');
  },

  async down(queryInterface, Sequelize) {
    // Logic to revert the seed (optional)
    await queryInterface.bulkDelete('Achievements', null, {});
    await queryInterface.bulkDelete('Courses', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  },
};
