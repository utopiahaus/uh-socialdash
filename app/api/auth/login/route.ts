import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI

  if (!appId || !redirectUri) {
    return NextResponse.json(
      { error: "Instagram app not configured" },
      { status: 500 }
    )
  }

  const authUrl = new URL("https://api.instagram.com/oauth/authorize")
  authUrl.searchParams.append("client_id", appId)
  authUrl.searchParams.append("redirect_uri", redirectUri)
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append(
    "scope",
    "instagram_basic,instagram_manage_insights,instagram_content_publish"
  )

  return NextResponse.redirect(authUrl.toString())
}
