export default {
  rootDir: '../',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/stage1/**/*.test.js'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testEnv.js'],
  transform: {},
};
