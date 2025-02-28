const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// File handling utilities
const fileUtils = {
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  },

  async removeFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  },

  getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  },

  generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = this.getFileExtension(originalFilename);
    return `${timestamp}-${random}${extension}`;
  }
};

// Date utilities
const dateUtils = {
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
};

// String utilities
const stringUtils = {
  slugify(text) {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  },

  truncate(str, length = 100, ending = '...') {
    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    }
    return str;
  },

  sanitizeHtml(html) {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }
};

// Array utilities
const arrayUtils = {
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  unique(array) {
    return [...new Set(array)];
  }
};

// Object utilities
const objectUtils = {
  pick(object, keys) {
    return keys.reduce((obj, key) => {
      if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        obj[key] = object[key];
      }
      return obj;
    }, {});
  },

  omit(object, keys) {
    const result = { ...object };
    keys.forEach(key => delete result[key]);
    return result;
  },

  isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }
};

// Validation utilities
const validationUtils = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// Progress calculation utilities
const progressUtils = {
  calculateCourseProgress(completedLessons, totalLessons) {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons / totalLessons) * 100);
  },

  calculateModuleProgress(completedLessons, moduleLessons) {
    return this.calculateCourseProgress(completedLessons, moduleLessons);
  },

  getProgressColor(percentage) {
    if (percentage >= 80) return 'green';
    if (percentage >= 50) return 'yellow';
    return 'red';
  }
};

module.exports = {
  fileUtils,
  dateUtils,
  stringUtils,
  arrayUtils,
  objectUtils,
  validationUtils,
  progressUtils
};
