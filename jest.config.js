module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverageFrom: ["src/**/*.js", "!src/scripts/**", "!src/config/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
