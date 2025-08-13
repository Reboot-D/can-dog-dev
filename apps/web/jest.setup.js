// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Setup test environment variables
process.env.GEMINI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Global test setup
global.ResizeObserver = require('resize-observer-polyfill')

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
}

// Mock Web APIs for Next.js API routes testing
Object.defineProperty(global, 'Request', {
  value: class Request {
    constructor(input, init) {
      Object.defineProperty(this, 'url', {
        value: input,
        writable: false,
        enumerable: true,
        configurable: true
      })
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
})

Object.defineProperty(global, 'Response', {
  value: class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Headers(init?.headers || {})
    }
    
    async json() {
      return JSON.parse(this.body)
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers
        }
      })
    }
  }
})

Object.defineProperty(global, 'Headers', {
  value: class Headers {
    constructor(init) {
      this.headers = {}
      if (init) {
        for (const [key, value] of Object.entries(init)) {
          this.headers[key.toLowerCase()] = value
        }
      }
    }
    
    get(name) {
      return this.headers[name.toLowerCase()]
    }
    
    set(name, value) {
      this.headers[name.toLowerCase()] = value
    }
  }
})