export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['<rootDir>/setUpTests.ts'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest'
    }
  };