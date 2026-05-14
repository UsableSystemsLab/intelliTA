const path = require('path');

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testMatch: [
    '<rootDir>/controllers/**/*.test.js',
    '<rootDir>/middlewares/**/*.test.js',
    '<rootDir>/utils/**/*.test.js',
    '<rootDir>/models/**/*.test.js',
    '<rootDir>/services/**/*.test.js',
  ],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: path.resolve(__dirname, 'babel.config.cjs') }],
  },
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!**/*.test.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  clearMocks: true,
  resetMocks: false,
};
