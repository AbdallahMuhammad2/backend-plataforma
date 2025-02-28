module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-duplicate-imports': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-return-await': 'error',
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    'no-throw-literal': 'error',
    'no-useless-catch': 'error',

    // Style
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-parens': ['error', 'always'],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],

    // Node.js specific
    'handle-callback-err': 'error',
    'no-buffer-constructor': 'error',
    'no-mixed-requires': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Error handling
    'no-promise-executor-return': 'error',
    'prefer-promise-reject-errors': 'error',

    // Modern JavaScript
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'prefer-destructuring': ['error', {
      array: false,
      object: true
    }],
    'prefer-spread': 'error',
    'prefer-rest-params': 'error',
    'object-shorthand': ['error', 'always'],

    // Async/Await
    'no-await-in-loop': 'warn',
    'require-atomic-updates': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
};
