'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import DOMPurify from 'isomorphic-dompurify'
import { FormTextarea } from '@/components/ui/form-textarea'
import { journalService } from '@/lib/journal/journal-service'
import { JournalEntry } from '@/types/supabase'

// Configuration constants
const MAX_CONTENT_LENGTH = 10000
const SUCCESS_MESSAGE_TIMEOUT = 3000
// const AI_ANALYSIS_RETRY_DELAY = 100 // Currently unused but may be needed for future retry logic

// Extracted component for better separation of concerns
interface AIAnalysisResultProps {
  result: string
  isError: boolean
}

function AIAnalysisResult({ result, isError }: AIAnalysisResultProps) {
  const baseClasses = 'text-sm whitespace-pre-wrap'
  const errorClasses = 'text-red-700 bg-red-50 p-2 rounded border-red-200 border'
  const successClasses = 'text-blue-800'
  
  return (
    <div className={`${baseClasses} ${isError ? errorClasses : successClasses}`}>
      {result}
    </div>
  )
}

interface JournalEntryFormProps {
  petId: string
  petName: string
  onEntryCreated?: (entry: JournalEntry) => void
}

export function JournalEntryForm({ petId, petName, onEntryCreated }: JournalEntryFormProps) {
  const t = useTranslations()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string>('')
  const [lastEntryId, setLastEntryId] = useState<string | null>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  const analyzeJournalEntry = async (entryId: string): Promise<void> => {
    try {
      setIsAnalyzing(true)

      const response = await fetch(`/api/pets/${petId}/journal/${entryId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'AI分析失败'
        
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error(t('journal.ai.errorMessages.rateLimited'))
        } else if (response.status >= 500) {
          throw new Error(t('journal.ai.errorMessages.serviceUnavailable'))
        } else {
          throw new Error(errorMessage)
        }
      }

      const result = await response.json()
      
      if (result.success && result.ai_advice) {
        setAnalysisResult(result.ai_advice)
      } else {
        throw new Error(t('journal.ai.errorMessages.invalidResponse'))
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      // Don't set general error for analysis failure as it's not critical
      // User can still see their journal entry was created successfully
      if (error instanceof Error) {
        setAnalysisResult(`${t('journal.ai.analysisError')}：${error.message}`)
      } else {
        setAnalysisResult(t('journal.ai.errorMessages.generalError'))
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setShowSuccess(false)

    try {
      // Client-side validation
      const newErrors: Record<string, string> = {}
      
      if (!content.trim()) {
        newErrors.content = t('journal.form.errors.contentRequired')
      } else if (content.length > MAX_CONTENT_LENGTH) {
        newErrors.content = t('journal.form.errors.contentTooLong')
      }

      if (!petId) {
        newErrors.general = t('journal.form.errors.noPetSelected')
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSubmitting(false)
        return
      }

      // Sanitize content on client-side as well (defense in depth)
      const sanitizedContent = DOMPurify.sanitize(content.trim(), {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [], // Strip all attributes
        KEEP_CONTENT: true // Keep text content
      })

      // Create journal entry via service
      const newEntry = await journalService.createJournalEntry(petId, sanitizedContent)
      
      // Reset form and show success
      setContent('')
      setShowSuccess(true)
      setAnalysisResult('')
      
      // Hide success message after 3 seconds
      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
      successTimeoutRef.current = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_TIMEOUT)
      
      // Notify parent component
      onEntryCreated?.(newEntry)
      
      // Start AI analysis in the background
      if (newEntry.id) {
        setLastEntryId(newEntry.id)
        analyzeJournalEntry(newEntry.id)
      }
      
    } catch (error) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating journal entry:', error)
      }
      
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          setErrors({ general: t('auth.invalidCredentials') })
        } else if (error.message.includes('Pet not found')) {
          setErrors({ general: t('journal.form.errors.noPetSelected') })
        } else if (error.message.includes('content cannot be empty')) {
          setErrors({ content: t('journal.form.errors.contentRequired') })
        } else if (error.message.includes('too long')) {
          setErrors({ content: t('journal.form.errors.contentTooLong') })
        } else {
          setErrors({ general: t('journal.form.errors.saveFailed') })
        }
      } else {
        setErrors({ general: t('journal.form.errors.saveFailed') })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)
    
    // Clear content error when user starts typing
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }))
    }
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="journal-entry-form">
      <h3 className="text-lg font-medium mb-4 text-gray-900">
        {t('journal.form.title')} - {petName}
      </h3>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{t('journal.form.success')}</p>
        </div>
      )}
      
      {/* Error Message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormTextarea
          label={t('journal.form.contentLabel')}
          placeholder={t('journal.form.contentPlaceholder')}
          value={content}
          onChange={handleContentChange}
          error={errors.content}
          required
          maxLength={MAX_CONTENT_LENGTH}
          disabled={isSubmitting}
          rows={6}
          className="resize-y"
        />
        
        {/* Character count helper */}
        <div className="text-sm text-gray-500 text-right">
          {content.length}/{MAX_CONTENT_LENGTH.toLocaleString()}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('journal.form.saving') : t('journal.form.saveButton')}
          </button>
        </div>
        
        {/* AI Analysis Section */}
        {(isAnalyzing || analysisResult) && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 21H5V3H14V8H19V21Z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-blue-900">{t('journal.ai.title')}</h4>
              </div>
              {analysisResult && !isAnalyzing && analysisResult.includes(t('journal.ai.analysisError')) && lastEntryId && (
                <button
                  onClick={() => analyzeJournalEntry(lastEntryId)}
                  className="text-xs text-blue-700 hover:text-blue-800 font-medium underline"
                >
                  {t('journal.ai.retryAnalysis')}
                </button>
              )}
            </div>
            
            {isAnalyzing && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                {t('journal.ai.analyzing')}
              </div>
            )}
            
            {analysisResult && !isAnalyzing && (
              <AIAnalysisResult 
                result={analysisResult} 
                isError={analysisResult.includes(t('journal.ai.analysisError'))}
              />
            )}
          </div>
        )}
      </form>
    </div>
  )
}