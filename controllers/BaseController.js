const { User } = require('../models'); // Import the User model

class BaseController {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findAll(options = {}) {
    const { where = '', params = [], orderBy = 'id' } = options;
    const result = await User.findAll({
      where: { ...params },
      order: [[orderBy, 'ASC']],
    });
    return result;
  }

  async findById(id) {
    const result = await User.findByPk(id);
    return result;
  }

  async create(data) {
    const result = await User.create(data);
    return result;
  }

  async update(id, data) {
    const result = await User.update(data, {
      where: { id },
      returning: true,
    });
    return result[1][0];
  }

  async delete(id) {
    const result = await User.destroy({
      where: { id },
    });
    return result;
  }

  async findOne(options = {}) {
    const { where = '', params = [] } = options;
    const result = await User.findOne({
      where: { ...params },
    });
    return result;
  }

  async count(options = {}) {
    const { where = '', params = [] } = options;
    const result = await User.count({
      where: { ...params },
    });
    return result;
  }

  async transaction(callback) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = BaseController;
