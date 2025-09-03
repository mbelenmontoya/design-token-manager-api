export default {
  rootDir: '../../',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/supabase/**/*.test.js'],
  globalSetup: '<rootDir>/tests/supabase/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/supabase/setup/globalTeardown.js',
  setupFiles: ['dotenv/config'],
  transform: {},
};
