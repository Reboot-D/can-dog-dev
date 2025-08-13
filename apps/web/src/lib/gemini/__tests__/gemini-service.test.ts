import { rateLimit } from '@/lib/rate-limit'

// Mock dependencies BEFORE importing the module
jest.mock('@google/generative-ai')
jest.mock('@/lib/rate-limit')

const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}))

// Import after mocking
import { GeminiService } from '../gemini-service'
import { GoogleGenerativeAI } from '@google/generative-ai'

describe('GeminiService', () => {
  let geminiService: GeminiService
  let mockGenerateContent: jest.Mock
  const originalEnv = process.env.GEMINI_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-api-key'
    geminiService = new GeminiService()
    
    // Get the mock after the service is created
    const mockGoogleAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>
    const mockInstance = mockGoogleAI.mock.results[0].value
    mockGenerateContent = mockInstance.getGenerativeModel().generateContent as jest.Mock
  })

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv
  })

  describe('constructor', () => {
    it('should throw error if API key is not set', () => {
      delete process.env.GEMINI_API_KEY
      expect(() => new GeminiService()).toThrow('GEMINI_API_KEY environment variable is not set')
    })

    it('should initialize with API key', () => {
      expect(() => new GeminiService()).not.toThrow()
    })
  })

  describe('analyzeJournalEntry', () => {
    const validRequest = {
      content: '今天小白很活跃，吃了很多狗粮',
      petName: '小白',
      petBreed: '金毛寻回犬'
    }

    beforeEach(() => {
      mockRateLimit.mockReturnValue({
        allowed: true,
        remainingRequests: 50,
        resetTime: Date.now() + 3600000
      })
    })

    it('should successfully analyze journal entry', async () => {
      const mockResponse = {
        response: {
          text: () => '根据您的描述，小白今天表现很好...'
        }
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await geminiService.analyzeJournalEntry(validRequest)

      expect(result.success).toBe(true)
      expect(result.analysis).toBe('根据您的描述，小白今天表现很好...')
      expect(result.error).toBeUndefined()
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('你是一个谨慎的宠物护理顾问助手'))
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('今天小白很活跃，吃了很多狗粮'))
    })

    it('should handle rate limit exceeded', async () => {
      mockRateLimit.mockReturnValue({
        allowed: false,
        remainingRequests: 0,
        resetTime: Date.now() + 3600000
      })

      const result = await geminiService.analyzeJournalEntry(validRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit exceeded. Please try again later.')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('should validate empty content', async () => {
      const invalidRequest = { ...validRequest, content: '' }

      const result = await geminiService.analyzeJournalEntry(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Journal content cannot be empty')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('should validate content length', async () => {
      const invalidRequest = { ...validRequest, content: 'a'.repeat(5001) }

      const result = await geminiService.analyzeJournalEntry(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Journal content is too long for analysis')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('should validate pet name', async () => {
      const invalidRequest = { ...validRequest, petName: '' }

      const result = await geminiService.analyzeJournalEntry(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Pet name is required for analysis')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('should handle API quota error', async () => {
      const quotaError = new Error('quota exceeded')
      mockGenerateContent.mockRejectedValue(quotaError)

      const result = await geminiService.analyzeJournalEntry(validRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('AI service quota exceeded. Please try again later.')
    })

    it('should handle network error', async () => {
      const networkError = new Error('network timeout')
      mockGenerateContent.mockRejectedValue(networkError)

      const result = await geminiService.analyzeJournalEntry(validRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error. Please check your connection and try again.')
    })

    it('should handle generic API error', async () => {
      const genericError = new Error('API error')
      mockGenerateContent.mockRejectedValue(genericError)

      const result = await geminiService.analyzeJournalEntry(validRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to analyze journal entry. Please try again later.')
    })

    it('should handle empty response from AI', async () => {
      const mockResponse = {
        response: {
          text: () => ''
        }
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await geminiService.analyzeJournalEntry(validRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No analysis generated from AI service')
    })

    it('should include breed information in prompt when provided', async () => {
      const mockResponse = {
        response: {
          text: () => 'Analysis with breed info'
        }
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await geminiService.analyzeJournalEntry(validRequest)

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('金毛寻回犬')
      )
    })

    it('should handle missing breed information', async () => {
      const requestWithoutBreed = {
        content: '今天小白很活跃',
        petName: '小白'
      }

      const mockResponse = {
        response: {
          text: () => 'Analysis without breed info'
        }
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      await geminiService.analyzeJournalEntry(requestWithoutBreed)

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('品种未知')
      )
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return rate limit status', async () => {
      const mockRateLimitInfo = {
        allowed: true,
        remainingRequests: 45,
        resetTime: Date.now() + 3600000
      }
      mockRateLimit.mockReturnValue(mockRateLimitInfo)

      const result = await geminiService.getRateLimitStatus()

      expect(result.limit).toBe(60)
      expect(result.remaining).toBe(45)
      expect(result.reset).toBe(mockRateLimitInfo.resetTime)
      expect(mockRateLimit).toHaveBeenCalledWith(
        'gemini-api',
        {
          windowMs: 3600000,
          maxRequests: 60
        }
      )
    })

    it('should handle rate limit check failure', async () => {
      const mockRateLimitInfo = {
        allowed: false,
        remainingRequests: 0,
        resetTime: undefined
      }
      mockRateLimit.mockReturnValue(mockRateLimitInfo)

      const result = await geminiService.getRateLimitStatus()

      expect(result.limit).toBe(60)
      expect(result.remaining).toBe(0)
      expect(result.reset).toBeGreaterThan(Date.now())
    })
  })
})