/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Global type declarations for tests and mocks

declare namespace jest {
  interface Mock<T = unknown, Y extends unknown[] = unknown[]> {
    mockReturnValueOnce: jest.MockInstance<T, Y>['mockReturnValueOnce']
    mockResolvedValue: jest.MockInstance<T, Y>['mockResolvedValue']
    mockRejectedValue: jest.MockInstance<T, Y>['mockRejectedValue']
  }
}

// Extended mock properties for complex Supabase test mocking
declare global {
  interface SupabaseClient {
    _validationChain?: unknown
    _updateChain?: unknown
    _deleteChain?: unknown
    _petValidationChain?: unknown
    _journalInsertChain?: unknown
    _journalSelectChain?: unknown
  }
  
  // Add missing global types for tests
  interface Window {
    ResizeObserver: unknown
    IntersectionObserver: unknown
  }
}

// Type augmentation for Supabase query builder to support mocking
declare module '@supabase/supabase-js' {
  interface PostgrestQueryBuilder<_Schema, _Row, _Relationships> {
    mockReturnValueOnce?: jest.MockInstance['mockReturnValueOnce']
  }
  
  interface SupabaseAuthClient {
    getUser?: jest.MockInstance<unknown, unknown[]>
  }
}

export {}