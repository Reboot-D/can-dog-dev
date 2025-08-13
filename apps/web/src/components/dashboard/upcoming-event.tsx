'use client'

import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar, Clock } from 'lucide-react'
import { Event } from '@/types/event'

interface UpcomingEventProps {
  event: Event | null
  loading?: boolean
}

export function UpcomingEvent({ event, loading = false }: UpcomingEventProps) {
  const t = useTranslations('dashboard.upcomingEvent')

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-36"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
        {t('title')}
      </h2>

      {event ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-medium text-gray-900">
              {event.title}
            </h3>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {t('dueDate')}: {format(new Date(event.due_date), 'PPP', { locale: zhCN })}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {t('status')}: <span className="font-medium text-gray-700">{t(`statusValues.${event.status}`)}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('noEvents')}</p>
        </div>
      )}
    </div>
  )
}