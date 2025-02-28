const BaseController = require('./BaseController');
const db = require('../config/database');

class WritingSubmissionController extends BaseController {
  constructor() {
    super('writing_submissions');
  }

  async submitWriting(data) {
    const { userId, title, content, fileUrl } = data;

    return await this.transaction(async (client) => {
      // Create the submission
      const query = `
        INSERT INTO writing_submissions 
          (user_id, title, content, file_url, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, title, content, fileUrl]);
      const submission = result.rows[0];

      // Check if user deserves any achievements
      await this.checkSubmissionAchievements(client, userId);

      return submission;
    });
  }

  async getSubmissionWithDetails(submissionId, userId) {
    const query = `
      SELECT 
        ws.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as user,
        CASE WHEN r.id IS NOT NULL THEN
          json_build_object(
            'id', r.id,
            'name', r.name,
            'avatar_url', r.avatar_url
          )
        ELSE NULL END as reviewer
      FROM writing_submissions ws
      JOIN users u ON u.id = ws.user_id
      LEFT JOIN users r ON r.id = ws.reviewer_id
      WHERE ws.id = $1 AND ws.user_id = $2
    `;

    const result = await db.query(query, [submissionId, userId]);
    return result.rows[0];
  }

  async getUserSubmissions(userId, options = {}) {
    const { status, limit = 10, offset = 0 } = options;
    const params = [userId];
    let paramCount = 1;

    let query = `
      SELECT 
        ws.*,
        json_build_object(
          'id', r.id,
          'name', r.name,
          'avatar_url', r.avatar_url
        ) as reviewer
      FROM writing_submissions ws
      LEFT JOIN users r ON r.id = ws.reviewer_id
      WHERE ws.user_id = $1
    `;

    if (status) {
      paramCount++;
      query += ` AND ws.status = $${paramCount}`;
      params.push(status);
    }

    query += `
      ORDER BY ws.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  async reviewSubmission(submissionId, reviewData) {
    const { reviewerId, feedback, score } = reviewData;

    return await this.transaction(async (client) => {
      // Update the submission
      const query = `
        UPDATE writing_submissions
        SET 
          reviewer_id = $1,
          feedback = $2,
          score = $3,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await client.query(query, [
        reviewerId,
        feedback,
        score,
        submissionId
      ]);

      const submission = result.rows[0];

      // Check for score-based achievements
      if (submission) {
        await this.checkScoreAchievements(client, submission.user_id, score);
      }

      return submission;
    });
  }

  async getSubmissionStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as reviewed_submissions,
        ROUND(AVG(score) FILTER (WHERE score IS NOT NULL), 1) as average_score,
        MAX(score) as highest_score
      FROM writing_submissions
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  async checkSubmissionAchievements(client, userId) {
    // Count total submissions
    const countQuery = `
      SELECT COUNT(*) as count
      FROM writing_submissions
      WHERE user_id = $1
    `;
    
    const { count } = (await client.query(countQuery, [userId])).rows[0];

    // Check for submission count achievements
    const achievements = [];
    if (count === 1) {
      achievements.push('first_submission');
    }
    if (count === 10) {
      achievements.push('ten_submissions');
    }
    if (count === 50) {
      achievements.push('fifty_submissions');
    }

    // Grant achievements
    for (const achievementCode of achievements) {
      await this.grantAchievement(client, userId, achievementCode);
    }
  }

  async checkScoreAchievements(client, userId, score) {
    const achievements = [];
    
    if (score >= 900) {
      achievements.push('excellent_writer');
    }
    if (score === 1000) {
      achievements.push('perfect_score');
    }

    // Check for consistent high scores
    const highScoresQuery = `
      SELECT COUNT(*) as count
      FROM writing_submissions
      WHERE user_id = $1 AND score >= 800
    `;
    
    const { count } = (await client.query(highScoresQuery, [userId])).rows[0];
    if (count >= 5) {
      achievements.push('consistent_performer');
    }

    // Grant achievements
    for (const achievementCode of achievements) {
      await this.grantAchievement(client, userId, achievementCode);
    }
  }

  async grantAchievement(client, userId, achievementCode) {
    // Get achievement ID
    const achievementQuery = `
      SELECT id FROM achievements WHERE code = $1
    `;
    
    const achievement = (await client.query(achievementQuery, [achievementCode])).rows[0];
    
    if (achievement) {
      // Grant achievement if not already granted
      const grantQuery = `
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, achievement_id) DO NOTHING
      `;
      
      await client.query(grantQuery, [userId, achievement.id]);
    }
  }
}

module.exports = new WritingSubmissionController();
