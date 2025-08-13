const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next-intl$': '<rootDir>/__mocks__/next-intl.js',
    '^next-intl/server$': '<rootDir>/__mocks__/next-intl-server.js',
    '^next-intl/middleware$': '<rootDir>/__mocks__/next-intl-middleware.js',
    '^@supabase/ssr$': '<rootDir>/__mocks__/@supabase/ssr.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase/.*|next-intl|@babel|isows|ws|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill|.*\\.mjs$))'
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)