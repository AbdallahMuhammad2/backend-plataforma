const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storageTypes = {
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);
        
        const fileName = `${hash.toString('hex')}-${file.originalname}`;
        cb(null, fileName);
      });
    },
  }),
  // Add S3 storage configuration for future use
  s3: multer.memoryStorage()
};

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

module.exports = {
  dest: path.resolve(__dirname, '..', 'uploads'),
  storage: storageTypes[process.env.STORAGE_TYPE || 'local'],
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
  
  // File upload configurations for different purposes
  configs: {
    writing: {
      // Writing submission files
      single: multer({
        dest: path.resolve(__dirname, '..', 'uploads', 'writings'),
        storage: storageTypes[process.env.STORAGE_TYPE || 'local'],
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
          const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          
          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Only PDF and Word documents are allowed'));
          }
        }
      }).single('file'),
    },
    
    avatar: {
      // User avatar images
      single: multer({
        dest: path.resolve(__dirname, '..', 'uploads', 'avatars'),
        storage: storageTypes[process.env.STORAGE_TYPE || 'local'],
        limits: {
          fileSize: 2 * 1024 * 1024, // 2MB
        },
        fileFilter: (req, file, cb) => {
          const allowedMimes = [
            'image/jpeg',
            'image/png'
          ];
          
          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
          }
        }
      }).single('avatar'),
    },
    
    material: {
      // Course materials
      single: multer({
        dest: path.resolve(__dirname, '..', 'uploads', 'materials'),
        storage: storageTypes[process.env.STORAGE_TYPE || 'local'],
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
        },
        fileFilter: (req, file, cb) => {
          const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ];
          
          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type for course material'));
          }
        }
      }).single('material'),
    }
  }
};
