import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      status: 'configuration_missing',
      supabase: 'not_configured',
      error: 'Missing Supabase environment variables',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }

  try {
    // Test basic Supabase connection
    const { error } = await supabase.from('_test_connection').select('*').limit(0)
    
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // PGRST116 and 42P01 mean table doesn't exist, which is fine for a connection test
      throw error
    }

    return NextResponse.json({
      status: 'healthy',
      supabase: 'connected',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({
      status: 'unhealthy',
      supabase: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}