const {
  fileUtils,
  dateUtils,
  stringUtils,
  arrayUtils,
  objectUtils,
  validationUtils,
  progressUtils
} = require('../../utils/helpers');
const path = require('path');
const fs = require('fs').promises;

describe('Utility Functions', () => {
  describe('File Utils', () => {
    const testDir = path.join(__dirname, 'test-files');
    const testFile = path.join(testDir, 'test.txt');

    beforeAll(async () => {
      await fs.mkdir(testDir, { recursive: true });
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should ensure directory exists', async () => {
      const newDir = path.join(testDir, 'new-dir');
      await fileUtils.ensureDirectoryExists(newDir);
      
      const exists = await fs.access(newDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should generate unique filenames', () => {
      const filename1 = fileUtils.generateUniqueFilename('test.jpg');
      const filename2 = fileUtils.generateUniqueFilename('test.jpg');

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/\.[^.]+$/);
    });

    it('should get correct file extension', () => {
      expect(fileUtils.getFileExtension('test.jpg')).toBe('.jpg');
      expect(fileUtils.getFileExtension('test')).toBe('');
      expect(fileUtils.getFileExtension('test.PDF')).toBe('.pdf');
    });
  });

  describe('Date Utils', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');

      expect(dateUtils.formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(dateUtils.formatDate(date, 'DD/MM/YYYY')).toBe('15/01/2024');
      expect(dateUtils.formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2024-01-15 10:30');
    });

    it('should validate dates', () => {
      expect(dateUtils.isValidDate('2024-01-15')).toBe(true);
      expect(dateUtils.isValidDate('invalid-date')).toBe(false);
      expect(dateUtils.isValidDate('2024-13-45')).toBe(false);
    });

    it('should add days correctly', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-20');
    });
  });

  describe('String Utils', () => {
    it('should slugify strings correctly', () => {
      expect(stringUtils.slugify('Hello World!')).toBe('hello-world');
      expect(stringUtils.slugify('Técnicas de Redação')).toBe('tecnicas-de-redacao');
      expect(stringUtils.slugify('  Spaces  ')).toBe('spaces');
    });

    it('should truncate strings', () => {
      const longText = 'This is a very long text that needs to be truncated';
      expect(stringUtils.truncate(longText, 20)).toBe('This is a very lon...');
      expect(stringUtils.truncate(longText, 20, '...')).toBe('This is a very lon...');
      expect(stringUtils.truncate('Short', 20)).toBe('Short');
    });

    it('should sanitize HTML', () => {
      const html = '<script>alert("xss")</script><p>Hello & World</p>';
      expect(stringUtils.sanitizeHtml(html)).not.toContain('<script>');
      expect(stringUtils.sanitizeHtml(html)).toContain('<');
      expect(stringUtils.sanitizeHtml(html)).toContain('&amp;');
    });
  });

  describe('Array Utils', () => {
    it('should chunk arrays correctly', () => {
      const array = [1, 2, 3, 4, 5, 6];
      expect(arrayUtils.chunk(array, 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
      expect(arrayUtils.chunk(array, 4)).toEqual([[1, 2, 3, 4], [5, 6]]);
    });

    it('should shuffle arrays', () => {
      const array = [1, 2, 3, 4, 5];
      const shuffled = arrayUtils.shuffle([...array]);
      
      expect(shuffled).toHaveLength(array.length);
      expect(shuffled).toContain(1);
      expect(shuffled).not.toEqual(array); // Note: there's a tiny chance this could fail
    });

    it('should return unique values', () => {
      expect(arrayUtils.unique([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(arrayUtils.unique(['a', 'b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Object Utils', () => {
    it('should pick specified properties', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(objectUtils.pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
      expect(objectUtils.pick(obj, ['a', 'nonexistent'])).toEqual({ a: 1 });
    });

    it('should omit specified properties', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(objectUtils.omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 });
      expect(objectUtils.omit(obj, ['nonexistent'])).toEqual(obj);
    });

    it('should check if object is empty', () => {
      expect(objectUtils.isEmptyObject({})).toBe(true);
      expect(objectUtils.isEmptyObject({ a: 1 })).toBe(false);
      expect(objectUtils.isEmptyObject([])).toBe(true);
    });
  });

  describe('Validation Utils', () => {
    it('should validate email addresses', () => {
      expect(validationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(validationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(validationUtils.isValidEmail('test@.com')).toBe(false);
    });

    it('should validate password strength', () => {
      expect(validationUtils.isStrongPassword('Abc123!@#')).toBe(true);
      expect(validationUtils.isStrongPassword('weakpass')).toBe(false);
      expect(validationUtils.isStrongPassword('NoSpecialChar1')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(validationUtils.isValidUrl('https://example.com')).toBe(true);
      expect(validationUtils.isValidUrl('invalid-url')).toBe(false);
      expect(validationUtils.isValidUrl('ftp://example.com')).toBe(true);
    });
  });

  describe('Progress Utils', () => {
    it('should calculate course progress correctly', () => {
      expect(progressUtils.calculateCourseProgress(5, 10)).toBe(50);
      expect(progressUtils.calculateCourseProgress(0, 10)).toBe(0);
      expect(progressUtils.calculateCourseProgress(10, 10)).toBe(100);
    });

    it('should calculate module progress correctly', () => {
      expect(progressUtils.calculateModuleProgress(3, 6)).toBe(50);
      expect(progressUtils.calculateModuleProgress(0, 5)).toBe(0);
    });

    it('should return correct progress color', () => {
      expect(progressUtils.getProgressColor(90)).toBe('green');
      expect(progressUtils.getProgressColor(60)).toBe('yellow');
      expect(progressUtils.getProgressColor(30)).toBe('red');
    });
  });
});
