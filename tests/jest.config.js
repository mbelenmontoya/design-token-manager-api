export default {
  rootDir: '../',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/endpoints/**/*.test.js'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testEnv.js'],
  transform: {},
};
