const BaseController = require('./BaseController');
const { Course, User, Lesson, UserProgress } = require('../models');
const { AppError } = require('../middleware/errorHandler');

class CourseController extends BaseController {
  constructor() {
    super('courses');
  }

  async getRecentCourses(userId) {
    try {
      const recentCourses = await UserProgress.findAll({
        where: {
          user_id: userId
        },
        order: [['updated_at', 'DESC']],
        limit: 5,
        include: [{
          model: Course,
          attributes: ['id', 'title', 'description', 'thumbnail_url', 'level', 'category', 'total_hours']
        }]
      });

      return recentCourses.map(progress => progress.Course);
    } catch (error) {
      console.error('Error fetching recent courses:', error);
      throw new AppError('Error fetching recent courses', 500);
    }
  }

  async markLessonComplete(lessonId, userId) {
    try {
      if (!lessonId || !userId) {
        throw new AppError('Lesson ID and User ID are required', 400);
      }

      console.log(`Marking lesson ID: ${lessonId} as complete for user ID: ${userId}`); // Added logging

      let userProgress = await UserProgress.findOne({
        where: {
          user_id: userId,
          lesson_id: lessonId,
        }
      });

      console.log(`User progress found: ${userProgress ? JSON.stringify(userProgress) : 'none'}`); // Improved logging

      if (!userProgress) {
        // Create a new user progress entry if it does not exist
        userProgress = await UserProgress.create({
          userId: userId,
          user_id: userId, // Ensure user_id is set
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`Created new user progress: ${JSON.stringify(userProgress)}`);
      } else {
        userProgress.completed = true; // Mark as complete
        userProgress.completed_at = new Date(); // Update the timestamp
        userProgress.updated_at = new Date(); // Update the timestamp
        await userProgress.save();
        console.log(`Updated user progress: ${JSON.stringify(userProgress)}`);
        const course = await Course.findByPk(courseId);
        const totalLessons = await Lesson.count({ where: { course_id: courseId } });
        const completedLessons = await UserProgress.count({ where: { user_id: userId, completed: true, course_id: courseId } });
  
        if (totalLessons === completedLessons) {
          // Update course status to completed
          course.completed = true; // Assuming there's a completed field in the Course model
          await course.save();
        }
      }

      return { message: 'Lesson marked as complete' };
    } catch (error) {
      console.error('Error marking lesson complete:', error.message); // Log only the error message
      console.error(`Input parameters: lessonId = ${lessonId}, userId = ${userId}`); // Log input parameters
      throw new AppError('Error marking lesson as complete', 500);
    }
  }

  async getCourse(courseId, userId) {
    try {
      if (!courseId || !userId) {
        throw new AppError('Course ID and User ID are required', 400);
      }

      console.log(`Fetching course ID: ${courseId} for user ID: ${userId}`);

      const course = await Course.findByPk(courseId, {
        logging: console.log,
        attributes: [
          'id', 'title', 'description', 'thumbnail_url',
          'level', 'category', 'total_hours'
        ],
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'name']
          },
          {
            model: Lesson,
            as: 'lessons',
            attributes: ['id', 'title', 'description', 'video_url', 'duration', 'order_index', 'module_id'],
            include: [
              {
                model: User,
                as: 'completedBy',
                attributes: ['id'],
                through: {
                  attributes: ['completed'],
                  where: { user_id: userId },
                  required: false
                }
              }
            ],
            order: [['order_index', 'ASC']]
          }
        ]
      });

      if (!course) {
        console.error(`Course with ID ${courseId} not found`);
        throw new AppError('Curso não encontrado. Por favor, verifique o ID do curso e tente novamente.', 404);
      }

      const courseJson = course.toJSON();
      const modules = [];
      const lessonMap = {};

      // Group lessons into modules
      courseJson.lessons.forEach(lesson => {
        const moduleId = lesson.module_id;
        if (!lessonMap[moduleId]) {
          lessonMap[moduleId] = {
            id: moduleId,
            lessons: []
          };
        }
        lessonMap[moduleId].lessons.push(lesson);
      });

      // Convert lessonMap to modules array
      for (const moduleId in lessonMap) {
        modules.push(lessonMap[moduleId]);
      }

      console.log(`Fetched course ID: ${courseJson.id}, Title: ${courseJson.title}`);
      console.log(courseJson);

      const totalLessons = courseJson.lessons.length;
      const completedLessons = courseJson.lessons.filter(lesson => {
        console.log(`Lesson ID: ${lesson.id}, CompletedBy: ${JSON.stringify(lesson.completedBy)}`);
        return lesson.completedBy && lesson.completedBy.some(user => user.UserProgress && user.UserProgress.completed);
      }).length;

      console.log(`Course ID: ${courseJson.id} - Total lessons: ${totalLessons}, Completed lessons: ${completedLessons}`);

      return {
        ...courseJson,
        modules,
        progress: {
          total_lessons: totalLessons,
          completed_lessons: completedLessons
        }
      };
    } catch (error) {
      console.error('Error fetching course ID:', courseId, error.message);
      console.log(`Error details: ${error.message}`);
      throw new AppError('Erro ao carregar os detalhes do curso. Por favor, verifique sua conexão e tente novamente.', 500);
    }
  }

  async getAllCourses(userId) {
    try {
      console.log(`Fetching all courses for user ID: ${userId}`);

      const courses = await Course.findAll({
        attributes: [
          'id', 'title', 'description', 'thumbnail_url',
          'level', 'category', 'total_hours'
        ],
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'name']
          },
          {
            model: Lesson,
            as: 'lessons',
            attributes: ['id', 'title', 'description', 'video_url', 'duration', 'order_index', 'module_id'],
            include: [
              {
                model: User,
                as: 'completedBy',
                attributes: [],
                through: {
                  attributes: ['completed'],
                  where: { user_id: userId },
                  required: false
                }
              }
            ],
            order: [['order_index', 'ASC']]
          }
        ],
        order: [['id', 'ASC']]
      });

      console.log(`Fetched ${courses.length} courses`);

      return courses.map(course => {
        const courseJson = course.toJSON();
        console.log(`Processing course ID: ${courseJson.id}, Title: ${courseJson.title}`);

        const totalLessons = courseJson.lessons.length;
        const completedLessons = courseJson.lessons.filter(lesson => {
          console.log(`Lesson ID: ${lesson.id}, CompletedBy: ${JSON.stringify(lesson.completedBy)}`);
          return lesson.completedBy && lesson.completedBy.some(user => user.UserProgress.completed);
        }).length;

        console.log(`Course ID: ${courseJson.id} - Total lessons: ${totalLessons}, Completed lessons: ${completedLessons}`);

        return {
          ...courseJson,
          progress: {
            total_lessons: totalLessons,
            completed_lessons: completedLessons
          }
        };
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new AppError('Error fetching courses', 500);
    }
  }
}

module.exports = new CourseController();