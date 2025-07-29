// Shared configuration constants and settings
export const APP_CONFIG = {
  name: 'PetCare AI',
  version: '1.0.0',
  description: 'AI-powered pet care management system'
} as const

// Environment configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
} as const

// Care schedule configuration
export * from './care-schedules'