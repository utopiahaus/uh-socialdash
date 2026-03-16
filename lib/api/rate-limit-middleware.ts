import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit } from "./rate-limiter"

export interface RateLimitConfig {
  limit?: number
  windowMs?: number
  identifier?: (request: NextRequest) => string
}

/**
 * Middleware factory to apply rate limiting to API routes
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function withRateLimit(config: RateLimitConfig = {}) {
  const {
    limit = 10,
    windowMs = 10000, // 10 seconds
    identifier = (req) => {
      // Default identifier: IP + URL
      const ip = req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown"
      return `${ip}:${req.nextUrl.pathname}`
    },
  } = config

  return async function rateLimitMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const identifierValue = identifier(request)

    const result = await checkRateLimit(request, limit, windowMs)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          resetTime: new Date(result.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = await fetch(request)

    // Clone response to add headers
    const modifiedResponse = new NextResponse(response.body, response)
    modifiedResponse.headers.set("X-RateLimit-Limit", limit.toString())
    modifiedResponse.headers.set("X-RateLimit-Remaining", result.remaining.toString())
    modifiedResponse.headers.set(
      "X-RateLimit-Reset",
      new Date(result.resetTime).toISOString()
    )

    // Note: identifierValue is not used here since we don't need to track individual requests

    return modifiedResponse
  }
}

/**
 * Apply rate limiting to a route handler
 * @param handler - The route handler function
 * @param config - Rate limit configuration
 * @returns Rate-limited route handler
 */
export function rateLimitHandler<T extends (
  request: NextRequest
) => Promise<NextResponse>>(
  handler: T,
  config: RateLimitConfig = {}
): T {
  return (async function(request: NextRequest): Promise<NextResponse> {
    const {
      limit = 10,
      windowMs = 10000,
      identifier = (req) => {
        const ip = req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown"
        return `${ip}:${req.nextUrl.pathname}`
      },
    } = config

    const identifierValue = identifier(request)
    const result = await checkRateLimit(request, limit, windowMs)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded",
          resetTime: new Date(result.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Call the original handler
    const response = await handler(request)

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(result.resetTime).toISOString()
    )

    return response
  }) as T
}
