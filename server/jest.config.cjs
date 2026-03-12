module.exports = {
  clearMocks: true,
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.ts$': '<rootDir>/jest.transform.cjs',
  },
}
