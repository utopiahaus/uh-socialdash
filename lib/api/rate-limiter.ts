/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis-based solutions like Upstash
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining requests
   */
  check(
    identifier: string,
    limit: number = 10,
    windowMs: number = 10000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    // Clean up expired entries
    if (entry && now >= entry.resetTime) {
      this.requests.delete(identifier)
    }

    // Get or create entry
    let currentEntry = this.requests.get(identifier)

    if (!currentEntry || now >= currentEntry.resetTime) {
      // Create new entry
      currentEntry = {
        count: 1,
        resetTime: now + windowMs,
      }
      this.requests.set(identifier, currentEntry)

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: currentEntry.resetTime,
      }
    }

    // Increment counter
    currentEntry.count++

    if (currentEntry.count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentEntry.resetTime,
      }
    }

    return {
      allowed: true,
      remaining: limit - currentEntry.count,
      resetTime: currentEntry.resetTime,
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

export default rateLimiter

/**
 * Middleware to check rate limit from request
 * @param request - Next.js request object
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  request: Request,
  limit: number = 10,
  windowMs: number = 10000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Extract identifier from request
  // Use IP address or user agent as identifier
  const ip = request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"

  const identifier = `${ip}:${request.url}`

  return rateLimiter.check(identifier, limit, windowMs)
}
