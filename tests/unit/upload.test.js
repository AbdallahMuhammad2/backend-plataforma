const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const uploadConfig = require('../../config/upload');

// Mock multer
jest.mock('multer', () => {
  const mockStorage = {
    destination: jest.fn(),
    filename: jest.fn()
  };
  return {
    diskStorage: jest.fn(() => mockStorage),
    memoryStorage: jest.fn(),
    __mockStorage: mockStorage
  };
});

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}));

describe('Upload Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Storage Configuration', () => {
    it('should configure local storage correctly', () => {
      const storage = uploadConfig.storage;
      expect(multer.diskStorage).toHaveBeenCalled();
      expect(multer.__mockStorage.destination).toBeDefined();
      expect(multer.__mockStorage.filename).toBeDefined();
    });

    it('should set correct destination path', () => {
      const req = {};
      const file = {};
      const cb = jest.fn();

      multer.__mockStorage.destination(req, file, cb);

      expect(cb).toHaveBeenCalledWith(
        null,
        expect.stringContaining('uploads')
      );
    });

    it('should generate unique filenames', () => {
      const req = {};
      const file = { originalname: 'test.jpg' };
      const cb = jest.fn();
      const mockHash = Buffer.from('mockhash');
      crypto.randomBytes.mockImplementation((size, cb) => cb(null, mockHash));

      multer.__mockStorage.filename(req, file, cb);

      expect(cb).toHaveBeenCalledWith(
        null,
        expect.stringMatching(/^[a-f0-9]+-test\.jpg$/)
      );
    });
  });

  describe('File Filters', () => {
    it('should accept allowed file types', () => {
      const cb = jest.fn();
      const allowedTypes = [
        { mimetype: 'application/pdf' },
        { mimetype: 'application/msword' },
        { mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ];

      allowedTypes.forEach(file => {
        uploadConfig.fileFilter({}, file, cb);
      });

      expect(cb).toHaveBeenCalledTimes(allowedTypes.length);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject disallowed file types', () => {
      const cb = jest.fn();
      const file = { mimetype: 'application/exe' };

      uploadConfig.fileFilter({}, file, cb);

      expect(cb).toHaveBeenCalledWith(
        expect.any(Error),
        false
      );
      expect(cb.mock.calls[0][0].message).toContain('Invalid file type');
    });
  });

  describe('Upload Configurations', () => {
    describe('Writing Submissions', () => {
      const { writing } = uploadConfig.configs;

      it('should have correct file size limit', () => {
        expect(writing.single.limits.fileSize).toBe(5 * 1024 * 1024); // 5MB
      });

      it('should only accept document files', () => {
        const cb = jest.fn();
        const validFile = { mimetype: 'application/pdf' };
        const invalidFile = { mimetype: 'image/jpeg' };

        writing.single.fileFilter({}, validFile, cb);
        expect(cb).toHaveBeenCalledWith(null, true);

        writing.single.fileFilter({}, invalidFile, cb);
        expect(cb).toHaveBeenCalledWith(
          expect.any(Error),
          false
        );
      });
    });

    describe('Avatar Uploads', () => {
      const { avatar } = uploadConfig.configs;

      it('should have correct file size limit', () => {
        expect(avatar.single.limits.fileSize).toBe(2 * 1024 * 1024); // 2MB
      });

      it('should only accept image files', () => {
        const cb = jest.fn();
        const validFile = { mimetype: 'image/jpeg' };
        const invalidFile = { mimetype: 'application/pdf' };

        avatar.single.fileFilter({}, validFile, cb);
        expect(cb).toHaveBeenCalledWith(null, true);

        avatar.single.fileFilter({}, invalidFile, cb);
        expect(cb).toHaveBeenCalledWith(
          expect.any(Error),
          false
        );
      });
    });

    describe('Course Materials', () => {
      const { material } = uploadConfig.configs;

      it('should have correct file size limit', () => {
        expect(material.single.limits.fileSize).toBe(10 * 1024 * 1024); // 10MB
      });

      it('should accept various document types', () => {
        const cb = jest.fn();
        const validFiles = [
          { mimetype: 'application/pdf' },
          { mimetype: 'application/msword' },
          { mimetype: 'application/vnd.ms-excel' }
        ];

        validFiles.forEach(file => {
          material.single.fileFilter({}, file, cb);
        });

        expect(cb).toHaveBeenCalledTimes(validFiles.length);
        expect(cb).toHaveBeenCalledWith(null, true);
      });
    });
  });

  describe('Storage Types', () => {
    it('should use local storage by default', () => {
      const originalEnv = process.env.STORAGE_TYPE;
      process.env.STORAGE_TYPE = undefined;

      const config = require('../../config/upload');
      expect(multer.diskStorage).toHaveBeenCalled();

      process.env.STORAGE_TYPE = originalEnv;
    });

    it('should support S3 storage configuration', () => {
      const originalEnv = process.env.STORAGE_TYPE;
      process.env.STORAGE_TYPE = 's3';

      const config = require('../../config/upload');
      expect(multer.memoryStorage).toHaveBeenCalled();

      process.env.STORAGE_TYPE = originalEnv;
    });
  });

  describe('File Path Generation', () => {
    it('should generate correct upload paths', () => {
      const writingPath = path.resolve(uploadConfig.dest, 'writings');
      const avatarPath = path.resolve(uploadConfig.dest, 'avatars');
      const materialPath = path.resolve(uploadConfig.dest, 'materials');

      expect(writingPath).toContain('uploads/writings');
      expect(avatarPath).toContain('uploads/avatars');
      expect(materialPath).toContain('uploads/materials');
    });
  });
});
