const BaseController = require('./BaseController');
const { Course, User, Lesson, UserProgress } = require('../models');
const { AppError } = require('../middleware/errorHandler');

class CourseController extends BaseController {
  constructor() {
    super('courses');
  }

  async getCourse(courseId, userId) {
    try {
      if (!courseId || !userId) {
        throw new AppError('Course ID and User ID are required', 400);
      }
      
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
            attributes: ['id', 'name'] // Updated line
          },
          {
            model: Lesson,
            as: 'lessons',
            attributes: ['id', 'title', 'description', 'video_url', 'duration', 'order_index', 'module_id'], // Include module_id
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
        ]
      });

      if (!course) {
        console.error(`Course with ID ${courseId} not found`);
        throw new AppError('Curso não encontrado. Por favor, verifique o ID do curso e tente novamente.', 404);
      }

      // Get last watched lesson for "continue watching"
      const lastWatched = await UserProgress.findOne({
        where: {
          userId,
          lesson_id: courseId, // Change this line

          completed: false
        },
        order: [['updated_at', 'DESC']],
        limit: 1
      });


      const courseJson = course.toJSON();
      const modules = []; // Initialize modules array
      const lessonMap = {}; // Temporary map to group lessons by module

      // Group lessons into modules
      courseJson.lessons.forEach(lesson => {
        const moduleId = lesson.module_id; // Assuming lessons have a module_id field
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

      console.log(`Fetched course ID: ${courseJson.id}, Title: ${courseJson.title}`); // Updated logging for fetched course
      console.log(courseJson); // Log the fetched course data

      return {
        ...courseJson,
        modules, // Include the modules array in the response
        progress: {
          total_lessons: courseJson.lessons.length,
          completed_lessons: courseJson.lessons.filter(lesson =>
            lesson.completedBy && lesson.completedBy.UserProgress?.completed
          ).length
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
      const courses = await Course.findAll({
        attributes: [
          'id', 'title', 'description', 'thumbnail_url',
          'level', 'category', 'total_hours'
        ],
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'name'] // Include instructor details
          },
          {
            model: Lesson,
            as: 'lessons',
            attributes: ['id'],
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
            ]
          }
        ],
        order: [['id', 'ASC']]
      });

      return courses.map(course => {
        const courseJson = course.toJSON();
        return {
          ...courseJson,
          progress: {
            total_lessons: courseJson.lessons.length,
            completed_lessons: courseJson.lessons.filter(lesson => 
              lesson.completedBy && lesson.completedBy.UserProgress?.completed
            ).length
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
