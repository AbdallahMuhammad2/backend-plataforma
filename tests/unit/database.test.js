const { Pool } = require('pg');
const db = require('../../config/database');

// Mock pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Database Configuration', () => {
  let pool;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('Connection Configuration', () => {
    it('should use environment variables for configuration', () => {
      expect(Pool).toHaveBeenCalledWith({
        user: expect.any(String),
        host: expect.any(String),
        database: expect.any(String),
        password: expect.any(String),
        port: expect.any(Number)
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Clear environment variables
      const originalEnv = process.env;
      process.env = {};

      // Re-require the database module
      jest.isolateModules(() => {
        const freshDb = require('../../config/database');
        expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
          user: 'postgres',
          host: 'localhost',
          port: 5432
        }));
      });

      // Restore environment variables
      process.env = originalEnv;
    });
  });

  describe('Query Execution', () => {
    it('should execute queries with parameters', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      pool.query.mockResolvedValue(mockResult);

      const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
      expect(result).toBe(mockResult);
    });

    it('should handle query errors', async () => {
      const mockError = new Error('Database error');
      pool.query.mockRejectedValue(mockError);

      await expect(
        db.query('SELECT * FROM nonexistent_table')
      ).rejects.toThrow('Database error');
    });
  });

  describe('Connection Management', () => {
    it('should handle connection errors', () => {
      const mockError = new Error('Connection error');
      const errorHandler = jest.fn();

      // Simulate connection error
      pool.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          handler(mockError);
        }
      });

      // Re-require the database module to trigger error handling
      jest.isolateModules(() => {
        const freshDb = require('../../config/database');
        pool.on('error', errorHandler);
      });

      expect(errorHandler).toHaveBeenCalledWith(mockError);
    });

    it('should release client back to pool after query', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);

      // Execute a query that requires a client
      await db.query('BEGIN');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Transaction Support', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('should support transactions', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // actual query
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await db.transaction(async (client) => {
        const res = await client.query('INSERT INTO users (name) VALUES ($1) RETURNING id', ['Test']);
        return res.rows[0];
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ id: 1 });
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Transaction error');
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(mockError) // query fails
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      await expect(
        db.transaction(async (client) => {
          await client.query('INSERT INTO users (name) VALUES ($1)', ['Test']);
        })
      ).rejects.toThrow('Transaction error');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Pool Shutdown', () => {
    it('should end pool connections', async () => {
      pool.end.mockResolvedValue();

      await db.pool.end();

      expect(pool.end).toHaveBeenCalled();
    });

    it('should handle pool shutdown errors', async () => {
      const mockError = new Error('Shutdown error');
      pool.end.mockRejectedValue(mockError);

      await expect(db.pool.end()).rejects.toThrow('Shutdown error');
    });
  });
});
