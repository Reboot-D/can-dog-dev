'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { journalService } from '@/lib/journal/journal-service'
import { JournalEntry } from '@/types/supabase'

interface JournalHistoryProps {
  petId: string
  petName: string
  refreshTrigger?: number
}

export function JournalHistory({ petId, petName, refreshTrigger }: JournalHistoryProps) {
  const t = useTranslations()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const journalEntries = await journalService.getJournalEntries(petId)
      setEntries(journalEntries)
    } catch (err) {
      console.error('Error loading journal entries:', err)
      if (err instanceof Error) {
        if (err.message.includes('not authenticated')) {
          setError(t('auth.invalidCredentials'))
        } else if (err.message.includes('Pet not found')) {
          setError(t('journal.history.errors.petNotFound'))
        } else {
          setError(t('journal.history.errors.loadFailed'))
        }
      } else {
        setError(t('journal.history.errors.loadFailed'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [petId, t])

  useEffect(() => {
    if (petId) {
      loadEntries()
    }
  }, [petId, refreshTrigger, loadEntries])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatContent = (content: string): string => {
    // Truncate content if too long for display
    const maxLength = 200
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '\u2026' // Using proper ellipsis character
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="journal-history">
        <h3 className="text-lg font-medium mb-4 text-gray-900">
          {t('journal.history.title')} - {petName}
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="journal-history">
        <h3 className="text-lg font-medium mb-4 text-gray-900">
          {t('journal.history.title')} - {petName}
        </h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadEntries}
            className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="journal-history">
        <h3 className="text-lg font-medium mb-4 text-gray-900">
          {t('journal.history.title')} - {petName}
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {t('journal.history.empty.title')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('journal.history.empty.description')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="journal-history">
      <h3 className="text-lg font-medium mb-4 text-gray-900">
        {t('journal.history.title')} - {petName}
      </h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <time className="text-sm text-gray-500 font-medium">
                {formatDate(entry.created_at)}
              </time>
            </div>
            
            <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
              {formatContent(entry.content)}
            </div>
            
            {entry.ai_advice && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <h4 className="text-sm font-medium text-blue-800">
                      {t('journal.history.aiAdvice')}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {entry.ai_advice}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {entries.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center border-t pt-4">
          {t('journal.history.entriesCount', { count: entries.length })}
        </div>
      )}
    </div>
  )
}