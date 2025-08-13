import { GoogleGenerativeAI } from '@google/generative-ai'
import { rateLimit } from '@/lib/rate-limit'

export interface GeminiAnalysisRequest {
  content: string
  petName: string
  petBreed?: string
}

export interface GeminiAnalysisResponse {
  analysis: string
  success: boolean
  error?: string
}

export interface GeminiRateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

const GEMINI_RATE_LIMIT_KEY = 'gemini-api'
const GEMINI_RATE_LIMIT = 60 // requests per hour
const GEMINI_RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
  }

  private createSystemPrompt(petName: string, petBreed?: string): string {
    const breedInfo = petBreed ? `品种是${petBreed}` : '品种未知'
    
    return `你是一个谨慎的宠物护理顾问助手。请仔细阅读关于宠物${petName}（${breedInfo}）的日记记录，并提供有用的护理建议。

重要指导原则：
1. 你不是兽医，不能提供医疗诊断或治疗建议
2. 如果日记内容提到任何健康问题或异常症状，建议主人咨询专业兽医
3. 专注于日常护理建议、行为观察和一般性健康维护建议
4. 回应必须使用简体中文
5. 保持友善、关怀和支持的语调
6. 如果内容不足以提供具体建议，请说明需要更多信息

请基于日记内容提供实用的护理建议，但始终提醒主人在有健康疑虑时咨询专业兽医。`
  }

  async analyzeJournalEntry(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    try {
      // Check rate limit
      const rateLimitResult = rateLimit(GEMINI_RATE_LIMIT_KEY, {
        windowMs: GEMINI_RATE_LIMIT_WINDOW,
        maxRequests: GEMINI_RATE_LIMIT
      })

      if (!rateLimitResult.allowed) {
        return {
          analysis: '',
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }
      }

      // Validate input
      if (!request.content || request.content.trim().length === 0) {
        return {
          analysis: '',
          success: false,
          error: 'Journal content cannot be empty'
        }
      }

      if (request.content.length > 5000) {
        return {
          analysis: '',
          success: false,
          error: 'Journal content is too long for analysis'
        }
      }

      if (!request.petName || request.petName.trim().length === 0) {
        return {
          analysis: '',
          success: false,
          error: 'Pet name is required for analysis'
        }
      }

      // Create the analysis prompt
      const systemPrompt = this.createSystemPrompt(request.petName, request.petBreed)
      const userPrompt = `日記內容：\n${request.content}`
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

      // Call Gemini API
      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      const analysis = response.text()

      if (!analysis || analysis.trim().length === 0) {
        return {
          analysis: '',
          success: false,
          error: 'No analysis generated from AI service'
        }
      }

      return {
        analysis: analysis.trim(),
        success: true
      }
    } catch (error) {
      console.error('Gemini API error:', error)
      
      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          return {
            analysis: '',
            success: false,
            error: 'AI service quota exceeded. Please try again later.'
          }
        }
        
        if (error.message.includes('network') || error.message.includes('timeout')) {
          return {
            analysis: '',
            success: false,
            error: 'Network error. Please check your connection and try again.'
          }
        }
      }

      return {
        analysis: '',
        success: false,
        error: 'Failed to analyze journal entry. Please try again later.'
      }
    }
  }

  async getRateLimitStatus(): Promise<GeminiRateLimitInfo> {
    const rateLimitResult = rateLimit(GEMINI_RATE_LIMIT_KEY, {
      windowMs: GEMINI_RATE_LIMIT_WINDOW,
      maxRequests: GEMINI_RATE_LIMIT
    })

    return {
      limit: GEMINI_RATE_LIMIT,
      remaining: rateLimitResult.remainingRequests || 0,
      reset: rateLimitResult.resetTime || Date.now() + GEMINI_RATE_LIMIT_WINDOW
    }
  }
}

export const geminiService = new GeminiService()