import { NextRequest, NextResponse } from "next/server"
import { InstagramApiClient } from "@/lib/api/instagram-client"
import { InstagramService } from "@/lib/services/instagram-service"
import { instagramProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { rateLimitHandler } from "@/lib/api/rate-limit-middleware"

async function oauthCallbackHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url))
  }

  try {
    // Exchange code for short-lived token
    const tokenUrl = new URL("https://api.instagram.com/oauth/access_token")
    tokenUrl.searchParams.append("client_id", process.env.INSTAGRAM_APP_ID!)
    tokenUrl.searchParams.append("client_secret", process.env.INSTAGRAM_APP_SECRET!)
    tokenUrl.searchParams.append("grant_type", "authorization_code")
    tokenUrl.searchParams.append("redirect_uri", process.env.INSTAGRAM_REDIRECT_URI!)
    tokenUrl.searchParams.append("code", code)

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "POST",
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()

    // Exchange short-lived token for long-lived token
    const client = new InstagramApiClient(tokenData.access_token)
    const longLivedToken = await client.exchangeToken(tokenData.access_token)

    // Get user profile
    const userProfile = await client.getUserProfile(tokenData.user_id)

    // Check if profile exists
    const existingProfile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.instagramId, userProfile.id),
    })

    const tokenExpiresAt = new Date(
      Date.now() + longLivedToken.expires_in * 1000
    )

    if (existingProfile) {
      // Update existing profile
      await InstagramService.updateProfile(existingProfile.id, {
        accessToken: longLivedToken.access_token,
        tokenExpiresAt,
        username: userProfile.username,
        profilePicUrl: userProfile.profile_picture_url,
        biography: userProfile.biography,
        websiteUrl: userProfile.website_url,
        isActive: true,
      })
    } else {
      // Create new profile
      await InstagramService.createProfile({
        instagramId: userProfile.id,
        username: userProfile.username,
        profilePicUrl: userProfile.profile_picture_url,
        biography: userProfile.biography,
        websiteUrl: userProfile.website_url,
        accessToken: longLivedToken.access_token,
        tokenExpiresAt,
        isActive: true,
      })
    }

    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error) {
    console.error("Instagram OAuth error:", error)
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    )
  }
}

// Apply rate limiting: 5 requests per minute to prevent OAuth abuse
export const GET = rateLimitHandler(oauthCallbackHandler, {
  limit: 5,
  windowMs: 60000,
})
