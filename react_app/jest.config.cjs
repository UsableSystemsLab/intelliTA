const path = require('path');

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testMatch: [
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.test.jsx',
  ],
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: path.resolve(__dirname, 'babel.jest.cjs') }],
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    
    '^@/utils/firebase$': '<rootDir>/src/__mocks__/firebase.js',
    '^@/utils/firebase\\.js$': '<rootDir>/src/__mocks__/firebase.js',
    '^(\\.\\.?/)+utils/firebase$': '<rootDir>/src/__mocks__/firebase.js',
    '^(\\.\\.?/)+utils/firebase\\.js$': '<rootDir>/src/__mocks__/firebase.js',

    '^@/(.*)$': '<rootDir>/src/$1',

    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg|webp|ico)$': '<rootDir>/src/__tests__/styleMock.js',

    '^firebase/auth$': '<rootDir>/src/__mocks__/firebase-auth.js',
    '^firebase/firestore$': '<rootDir>/src/__mocks__/firebase-firestore.js',

    '^react-i18next$': '<rootDir>/src/__mocks__/react-i18next.js',

    '^react-markdown$': '<rootDir>/src/__mocks__/react-markdown.jsx',
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/utils/firebase.js',
    '!src/**/index.{js,jsx}',
    '!src/styles/**',
    '!src/locales/**',
    '!src/__tests__/**',
    '!src/__mocks__/**',
    '!src/**/*.test.{js,jsx}',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  clearMocks: true,
  resetMocks: false,
};
