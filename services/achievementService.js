const { BaseController } = require('../controllers/BaseController');
const { progressUtils } = require('../utils/helpers');
const emailService = require('./emailService');

class AchievementService {
  constructor() {
    this.db = new BaseController('achievements');
    this.userAchievementsDb = new BaseController('user_achievements');
    this.initializeAchievements();
  }

  initializeAchievements() {
    this.achievementConditions = {
      FIRST_SUBMISSION: {
        code: 'first_submission',
        check: this.checkFirstSubmission.bind(this)
      },
      PERFECT_SCORE: {
        code: 'perfect_score',
        check: this.checkPerfectScore.bind(this)
      },
      COURSE_COMPLETED: {
        code: 'course_completed',
        check: this.checkCourseCompleted.bind(this)
      },
      STUDY_STREAK: {
        code: 'study_streak_7',
        check: this.checkStudyStreak.bind(this)
      },
      WATCHED_LESSON: {
        code: 'watched_lesson',
        check: this.checkLessonWatched.bind(this)
      }
    };
  }

  async checkFirstSubmission(userId) {
    const submissions = await this.db.query(
      'SELECT COUNT(*) as count FROM writing_submissions WHERE user_id = $1',
      [userId]
    );
    return submissions.rows[0].count === 1;
  }

  async checkPerfectScore(userId) {
    const submissions = await this.db.query(
      'SELECT COUNT(*) as count FROM writing_submissions WHERE user_id = $1 AND score = 1000',
      [userId]
    );
    return submissions.rows[0].count > 0;
  }

  async checkCourseCompleted(userId, courseId) {
    const progress = await this.calculateCourseProgress(userId, courseId);
    return progress === 100;
  }

  async checkStudyStreak(userId) {
    const streak = await this.calculateStudyStreak(userId);
    return streak >= 7;
  }

  async checkAndGrantAchievements(userId, context = {}, lessonId = null) {
    try {
      const currentAchievements = await this.getUserAchievements(userId);
      const newAchievements = [];

      // Check if the lesson has been watched
      if (lessonId) {
        const watchedAchievement = await this.checkLessonWatched(userId, lessonId);
        if (watchedAchievement) {
          newAchievements.push(watchedAchievement);
        }
      }

      for (const [key, achievement] of Object.entries(this.achievementConditions)) {
        if (currentAchievements.some(a => a.code === achievement.code)) {
          continue;
        }

        const isAchieved = await achievement.check(userId, context);
        if (isAchieved) {
          const granted = await this.grantAchievement(userId, achievement.code);
          if (granted) {
            newAchievements.push(granted);
          }
        }
      }

      if (newAchievements.length > 0) {
        await this.notifyNewAchievements(userId, newAchievements);
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  async checkLessonWatched(userId, lessonId) {
    const progress = await this.userProgressDb.query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    if (progress.rows.length > 0 && progress.rows[0].completed) {
      return this.grantAchievement(userId, 'watched_lesson');
    }
    return null;
  }

  async grantAchievement(userId, achievementCode) {
    try {
      const achievement = await this.db.findOne({
        where: 'code = $1',
        params: [achievementCode]
      });

      if (!achievement) {
        throw new Error(`Achievement ${achievementCode} not found`);
      }

      const existing = await this.userAchievementsDb.findOne({
        where: 'user_id = $1 AND achievement_id = $2',
        params: [userId, achievement.id]
      });

      if (existing) {
        return null;
      }

      await this.userAchievementsDb.create({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date()
      });

      return achievement;
    } catch (error) {
      console.error('Error granting achievement:', error);
      throw error;
    }
  }

  async getUserAchievements(userId) {
    try {
      const query = `
        SELECT 
          a.*,
          ua.unlocked_at
        FROM achievements a
        JOIN user_achievements ua ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC
      `;

      const result = await this.db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  }

  async calculateStudyStreak(userId) {
    try {
      const query = `
        WITH daily_activity AS (
          SELECT 
            DISTINCT DATE(created_at) as activity_date
          FROM (
            SELECT created_at FROM user_progress WHERE user_id = $1
            UNION ALL
            SELECT created_at FROM writing_submissions WHERE user_id = $1
          ) activities
          ORDER BY activity_date DESC
        )
        SELECT COUNT(*) as streak
        FROM (
          SELECT 
            activity_date,
            activity_date - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY activity_date DESC) as group_date
          FROM daily_activity
        ) grouped
        WHERE group_date = (
          SELECT MIN(activity_date - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY activity_date DESC))
          FROM daily_activity
        )
      `;

      const result = await this.db.query(query, [userId]);
      return parseInt(result.rows[0].streak);
    } catch (error) {
      console.error('Error calculating study streak:', error);
      throw error;
    }
  }

  async calculateCourseProgress(userId, courseId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT l.id) as total_lessons,
          COUNT(DISTINCT CASE WHEN up.completed THEN l.id END) as completed_lessons
        FROM courses c
        JOIN modules m ON m.course_id = c.id
        JOIN lessons l ON l.module_id = m.id
        LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = $1
        WHERE c.id = $2
      `;

      const result = await this.db.query(query, [userId, courseId]);
      const { total_lessons, completed_lessons } = result.rows[0];

      return progressUtils.calculateCourseProgress(completed_lessons, total_lessons);
    } catch (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
  }

  async notifyNewAchievements(userId, achievements) {
    try {
      const userQuery = 'SELECT * FROM users WHERE id = $1';
      const userResult = await this.db.query(userQuery, [userId]);
      const user = userResult.rows[0];

      if (!user) {
        throw new Error('User not found');
      }

      await emailService.sendAchievementUnlockedEmail(user, achievements);
    } catch (error) {
      console.error('Error notifying achievements:', error);
    }
  }
}

module.exports = new AchievementService();
