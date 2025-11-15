module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '../context/AuthContext': '<rootDir>/src/context/__mocks__/AuthContext.tsx',
    '../lib/api': '<rootDir>/src/lib/__mocks__/api.ts',
    '^.+\\.(css|less|scss)$': 'jest-transform-stub',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library/react|react-router-dom|react-router|@tanstack/react-query|@radix-ui|lucide-react|date-fns|embla-carousel-react|input-otp|next-themes|react-day-picker|react-hook-form|react-resizable-panels|recharts|sonner|tailwind-merge|tailwindcss-animate|vaul))',
  ],
};
