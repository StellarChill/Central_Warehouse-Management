module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '../context/AuthContext': '<rootDir>/src/context/__mocks__/AuthContext.tsx',
    '../lib/api': '<rootDir>/src/lib/__mocks__/api.ts',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '\\.ts$': ['ts-jest', {
      // ts-jest configuration here
      // for example:
      tsconfig: 'tsconfig.json',
      diagnostics: {
        ignoreCodes: [1343]
      },
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: { metaObject: { env: { VITE_LIFF_ID: 'test-liff-id' } } }
          }
        ]
      }
    }],
  },
};
