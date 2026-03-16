import { NextRequest, NextResponse } from "next/server"
import { tokenRefreshService } from "@/lib/services/token-refresh-service"
import { rateLimitHandler } from "@/lib/api/rate-limit-middleware"

async function refreshTokenHandler(request: NextRequest) {
  try {
    const result = await tokenRefreshService.refreshExpiredTokens()

    return NextResponse.json({
      success: true,
      message: "Token refresh completed",
      data: {
        checked: result.checked,
        refreshed: result.refreshed,
        failed: result.failed,
      },
    })
  } catch (error) {
    console.error("Error refreshing tokens:", error)
    return NextResponse.json(
      {
        error: "Failed to refresh tokens",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 2 requests per hour
export const POST = rateLimitHandler(refreshTokenHandler, {
  limit: 2,
  windowMs: 3600000, // 1 hour
})

// GET endpoint to check tokens needing refresh
async function checkTokensHandler(request: NextRequest) {
  try {
    const profilesNeedingRefresh =
      await tokenRefreshService.getProfilesNeedingRefresh(7)

    return NextResponse.json({
      success: true,
      data: {
        count: profilesNeedingRefresh.length,
        profiles: profilesNeedingRefresh,
      },
    })
  } catch (error) {
    console.error("Error checking tokens:", error)
    return NextResponse.json(
      {
        error: "Failed to check tokens",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export const GET = checkTokensHandler
