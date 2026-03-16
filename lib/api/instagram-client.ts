import { InstagramProfile, Media, MetricsDaily, MediaMetricsDaily } from "@/lib/db/schema"

export interface InstagramUserProfile {
  id: string
  username: string
  profile_picture_url: string
  biography: string
  website_url: string
  followers_count: number
  follows_count: number
  media_count: number
}

export interface InstagramMedia {
  id: string
  caption: string | null
  media_type: "CAROUSEL_ALBUM" | "IMAGE" | "VIDEO"
  media_url: string
  permalink: string
  timestamp: string
  thumbnail_url?: string
}

export interface InstagramInsights {
  impressions: number
  reach: number
  engagement_rate: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export class InstagramApiClient {
  private accessToken: string
  private baseUrl = "https://graph.instagram.com"

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.append("access_token", this.accessToken)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getUserProfile(userId: string): Promise<InstagramUserProfile> {
    const data = await this.request<{
      id: string
      username: string
      profile_picture_url: string
      biography: string
      website_url: string
      followers_count: number
      follows_count: number
      media_count: number
    }>(
      `/${userId}`,
      {
        fields:
          "id,username,profile_picture_url,biography,website_url,followers_count,follows_count,media_count",
      }
    )

    return data
  }

  async getUserMedia(userId: string): Promise<InstagramMedia[]> {
    const data = await this.request<{
      data: InstagramMedia[]
      paging?: { next?: string }
    }>(`/${userId}/media`, {
      fields:
        "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url",
      limit: "100",
    })

    return data.data
  }

  async getMediaInsights(mediaId: string): Promise<InstagramInsights> {
    const data = await this.request<{
      data: Array<{
        name: string
        values: Array<{ value: number }>
      }>
    }>(`/${mediaId}/insights`, {
      metric: "engagement,impressions,reach,saved,shares,comments,likes",
    })

    const metrics = data.data.reduce((acc, item) => {
      acc[item.name] = item.values[0]?.value || 0
      return acc
    }, {} as Record<string, number>)

    return {
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      engagement_rate: metrics.engagement || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      saves: metrics.saved || 0,
    }
  }

  async getUserInsights(userId: string): Promise<{
    impressions: number
    reach: number
    profile_views: number
    website_clicks: number
  }> {
    const data = await this.request<{
      data: Array<{
        name: string
        values: Array<{ value: number }>
      }>
    }>(`/${userId}/insights`, {
      metric: "impressions,reach,profile_views,website_clicks",
      period: "day",
    })

    const metrics = data.data.reduce((acc, item) => {
      acc[item.name] = item.values[0]?.value || 0
      return acc
    }, {} as Record<string, number>)

    return {
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      profile_views: metrics.profile_views || 0,
      website_clicks: metrics.website_clicks || 0,
    }
  }

  async exchangeToken(shortLivedToken: string): Promise<{
    access_token: string
    token_type: string
    expires_in: number
  }> {
    const url = new URL(
      "https://graph.instagram.com/access_token"
    )
    url.searchParams.append("grant_type", "ig_exchange_token")
    url.searchParams.append("client_secret", process.env.INSTAGRAM_APP_SECRET!)
    url.searchParams.append("access_token", shortLivedToken)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`)
    }

    return response.json()
  }

  async refreshToken(longLivedToken: string): Promise<{
    access_token: string
    token_type: string
    expires_in: number
  }> {
    const url = new URL(
      "https://graph.instagram.com/refresh_access_token"
    )
    url.searchParams.append("grant_type", "ig_refresh_token")
    url.searchParams.append("access_token", longLivedToken)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`)
    }

    return response.json()
  }
}
