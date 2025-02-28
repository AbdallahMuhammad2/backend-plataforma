const { BaseController } = require('../../controllers/BaseController');
const { pool } = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('BaseController', () => {
  let controller;
  const tableName = 'test_table';

  beforeEach(() => {
    controller = new BaseController(tableName);
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should fetch all records without conditions', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await controller.findAll();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(`SELECT * FROM ${tableName}`),
        []
      );
      expect(result).toHaveLength(2);
    });

    it('should apply where conditions', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await controller.findAll({
        where: 'status = $1',
        params: ['active']
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['active']
      );
    });

    it('should apply order by', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await controller.findAll({ orderBy: 'created_at DESC' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        []
      );
    });
  });

  describe('findById', () => {
    it('should fetch record by id', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      pool.query.mockResolvedValue({ rows: [mockRecord] });

      const result = await controller.findById(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(`SELECT * FROM ${tableName} WHERE id = $1`),
        [1]
      );
      expect(result).toEqual(mockRecord);
    });

    it('should return null for non-existent id', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await controller.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should insert new record', async () => {
      const mockData = { name: 'Test', status: 'active' };
      const mockResult = { id: 1, ...mockData };
      pool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await controller.create(mockData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO.*RETURNING/),
        expect.arrayContaining(['Test', 'active'])
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle empty data object', async () => {
      await expect(controller.create({})).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update existing record', async () => {
      const mockData = { name: 'Updated' };
      const mockResult = { id: 1, ...mockData };
      pool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await controller.update(1, mockData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE.*SET.*RETURNING/),
        expect.arrayContaining(['Updated', 1])
      );
      expect(result).toEqual(mockResult);
    });

    it('should return null for non-existent record', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await controller.update(999, { name: 'Updated' });

      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete existing record', async () => {
      const mockResult = { id: 1, name: 'Deleted' };
      pool.query.mockResolvedValue({ rows: [mockResult] });

      const result = await controller.delete(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(`DELETE FROM ${tableName} WHERE id = $1`),
        [1]
      );
      expect(result).toEqual(mockResult);
    });

    it('should return null for non-existent record', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await controller.delete(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should fetch single record with conditions', async () => {
      const mockRecord = { id: 1, email: 'test@example.com' };
      pool.query.mockResolvedValue({ rows: [mockRecord] });

      const result = await controller.findOne({
        where: 'email = $1',
        params: ['test@example.com']
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1 LIMIT 1'),
        ['test@example.com']
      );
      expect(result).toEqual(mockRecord);
    });

    it('should return null when no record found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await controller.findOne({
        where: 'email = $1',
        params: ['nonexistent@example.com']
      });

      expect(result).toBeUndefined();
    });
  });

  describe('count', () => {
    it('should count all records', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await controller.count();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(`SELECT COUNT(*) FROM ${tableName}`),
        []
      );
      expect(result).toBe(5);
    });

    it('should count with conditions', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '3' }] });

      const result = await controller.count({
        where: 'status = $1',
        params: ['active']
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['active']
      );
      expect(result).toBe(3);
    });
  });

  describe('transaction', () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      pool.connect = jest.fn().mockResolvedValue(mockClient);
      mockClient.query.mockReset();
      mockClient.release.mockReset();
    });

    it('should execute transaction successfully', async () => {
      const mockCallback = jest.fn().mockResolvedValue('result');

      const result = await controller.transaction(mockCallback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should rollback on error', async () => {
      const mockError = new Error('Transaction failed');
      const mockCallback = jest.fn().mockRejectedValue(mockError);

      await expect(controller.transaction(mockCallback)).rejects.toThrow(mockError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
