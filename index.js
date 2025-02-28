const app = require('./server');

// Try ports in sequence until we find an available one
const PORT = process.env.PORT || 3001;
const MAX_PORT = PORT + 10;

let currentPort = PORT;
while (currentPort <= MAX_PORT) {
  try {
    const server = app.listen(currentPort);
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
        currentPort++;
        server.close();
      }
    });
    server.on('listening', () => {
      console.log(`\n    🚀 Server is running on http://localhost:${currentPort}\n`);
      
      console.log('    Available endpoints:');
      console.log('    - Auth:');
      console.log('      POST /api/auth/register');
      console.log('      POST /api/auth/login\n');
      
      console.log('    - Users:');
      console.log('      GET  /api/users/profile');
      console.log('      PUT  /api/users/profile');
      console.log('      GET  /api/users/progress');
      console.log('      GET  /api/users/achievements\n');
      
      console.log('    - Courses:');
      console.log('      GET  /api/courses');
      console.log('      GET  /api/courses/:id');
      console.log('      GET  /api/courses/:id/modules');
      console.log('      GET  /api/courses/modules/:moduleId/lessons');
      console.log('      POST /api/courses/lessons/:lessonId/complete\n');
      
      console.log('    - Writing Submissions:');
      console.log('      POST /api/submissions');
      console.log('      GET  /api/submissions');
      console.log('      GET  /api/submissions/:id');
      console.log('      POST /api/submissions/:id/review\n');
      
      console.log('    Environment:', process.env.NODE_ENV || 'development');
    });
    break;
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
      currentPort++;
    } else {
      console.error('Error starting server:', error);
      process.exit(1);
    }
  }
}
