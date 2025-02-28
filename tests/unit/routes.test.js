const { ROUTES } = require('../../config/routes');
const { isPublicRoute, isProtectedRoute, getCoursePath } = require('../../config/routes');

describe('Route Configuration', () => {
  describe('Route Constants', () => {
    it('should define all required routes', () => {
      expect(ROUTES).toEqual({
        LOGIN: '/login',
        HOME: '/',
        COURSE: '/course/:courseId',
        COMMUNITY: '/community',
        SUBMISSIONS: '/submissions',
        PROFILE: '/profile',
        SETTINGS: '/settings',
      });
    });

    it('should have immutable routes', () => {
      expect(() => {
        ROUTES.LOGIN = '/new-login';
      }).toThrow();
    });
  });

  describe('Route Helpers', () => {
    describe('getCoursePath', () => {
      it('should generate correct course path', () => {
        const courseId = '123';
        const path = getCoursePath(courseId);
        expect(path).toBe('/course/123');
      });

      it('should handle different courseId types', () => {
        expect(getCoursePath(123)).toBe('/course/123');
        expect(getCoursePath('abc-123')).toBe('/course/abc-123');
      });
    });

    describe('isPublicRoute', () => {
      it('should identify public routes', () => {
        expect(isPublicRoute(ROUTES.LOGIN)).toBe(true);
      });

      it('should reject protected routes', () => {
        expect(isPublicRoute(ROUTES.PROFILE)).toBe(false);
        expect(isPublicRoute(ROUTES.SETTINGS)).toBe(false);
      });

      it('should handle unknown routes', () => {
        expect(isPublicRoute('/unknown')).toBe(false);
      });
    });

    describe('isProtectedRoute', () => {
      it('should identify protected routes', () => {
        expect(isProtectedRoute(ROUTES.PROFILE)).toBe(true);
        expect(isProtectedRoute(ROUTES.SETTINGS)).toBe(true);
        expect(isProtectedRoute(ROUTES.COMMUNITY)).toBe(true);
      });

      it('should identify course routes as protected', () => {
        expect(isProtectedRoute('/course/123')).toBe(true);
        expect(isProtectedRoute('/course/abc')).toBe(true);
      });

      it('should reject public routes', () => {
        expect(isProtectedRoute(ROUTES.LOGIN)).toBe(false);
      });

      it('should handle unknown routes', () => {
        expect(isProtectedRoute('/unknown')).toBe(false);
      });
    });
  });

  describe('Route Patterns', () => {
    describe('Course Routes', () => {
      it('should match valid course paths', () => {
        const coursePattern = /^\/course\/[\w-]+$/;
        expect(getCoursePath('123')).toMatch(coursePattern);
        expect(getCoursePath('abc-123')).toMatch(coursePattern);
      });
    });

    describe('API Routes', () => {
      const apiRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/users/profile',
        '/api/courses',
        '/api/submissions'
      ];

      it('should follow API route pattern', () => {
        const apiPattern = /^\/api\/[\w-]+(?:\/[\w-]+)*$/;
        apiRoutes.forEach(route => {
          expect(route).toMatch(apiPattern);
        });
      });
    });
  });

  describe('Route Organization', () => {
    describe('Auth Routes', () => {
      const authRoutes = [
        ROUTES.LOGIN,
        // Add other auth routes as they are defined
      ];

      it('should be properly categorized', () => {
        authRoutes.forEach(route => {
          expect(isPublicRoute(route)).toBe(true);
          expect(isProtectedRoute(route)).toBe(false);
        });
      });
    });

    describe('Protected Routes', () => {
      const protectedRoutes = [
        ROUTES.HOME,
        ROUTES.PROFILE,
        ROUTES.SETTINGS,
        ROUTES.COMMUNITY,
        ROUTES.SUBMISSIONS
      ];

      it('should be properly categorized', () => {
        protectedRoutes.forEach(route => {
          expect(isProtectedRoute(route)).toBe(true);
          expect(isPublicRoute(route)).toBe(false);
        });
      });
    });

    describe('Dynamic Routes', () => {
      it('should handle course route parameters', () => {
        const courseIds = ['123', 'abc-123', 'course-title-123'];
        courseIds.forEach(id => {
          const path = getCoursePath(id);
          expect(isProtectedRoute(path)).toBe(true);
          expect(path).toMatch(/^\/course\//);
        });
      });
    });
  });

  describe('Route Security', () => {
    it('should protect all user-specific routes', () => {
      const userRoutes = [
        ROUTES.PROFILE,
        ROUTES.SETTINGS,
        '/api/users/profile',
        '/api/users/settings'
      ];

      userRoutes.forEach(route => {
        expect(isProtectedRoute(route)).toBe(true);
      });
    });

    it('should protect all course content routes', () => {
      const courseRoutes = [
        getCoursePath('123'),
        '/api/courses/123/modules',
        '/api/courses/123/lessons'
      ];

      courseRoutes.forEach(route => {
        expect(isProtectedRoute(route)).toBe(true);
      });
    });

    it('should protect all submission routes', () => {
      const submissionRoutes = [
        ROUTES.SUBMISSIONS,
        '/api/submissions',
        '/api/submissions/123'
      ];

      submissionRoutes.forEach(route => {
        expect(isProtectedRoute(route)).toBe(true);
      });
    });
  });
});
