/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a more sophisticated solution
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage for rate limiting
// In production, this should be replaced with Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clear all rate limit entries (for testing purposes)
 */
export function clearRateLimit() {
  rateLimitStore.clear()
}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitResult {
  allowed: boolean
  resetTime?: number
  remainingRequests?: number
}

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param options - Rate limiting configuration
 * @returns Rate limit result
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()

  // Clean up expired entries
  const entries = Array.from(rateLimitStore.entries())
  for (const [entryKey, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(entryKey)
    }
  }

  // Get or create entry for this key
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + options.windowMs
    }
    rateLimitStore.set(key, newEntry)
    
    return {
      allowed: true,
      resetTime: newEntry.resetTime,
      remainingRequests: options.maxRequests - 1
    }
  }

  // Check if limit exceeded
  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remainingRequests: 0
    }
  }

  // Increment count
  entry.count += 1
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    resetTime: entry.resetTime,
    remainingRequests: options.maxRequests - entry.count
  }
}

/**
 * Rate limit configuration for journal entries
 * Allow 10 journal entries per user per hour
 */
export const JOURNAL_RATE_LIMIT_CONFIG: RateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  maxRequests: 10 // 10 journal entries per hour per user
}