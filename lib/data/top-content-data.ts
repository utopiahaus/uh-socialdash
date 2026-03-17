/**
 * Top Content Data Access
 *
 * Server-side data fetching for the top content panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, media, mediaMetricsDaily } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"

/**
 * Top post data
 */
export interface TopPostData {
  id: number
  instagramId: string
  caption: string | null
  thumbnailUrl: string | null
  permalink: string | null
  timestamp: Date
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  rank: number
}

/**
 * Top reel data
 */
export interface TopReelData {
  id: number
  instagramId: string
  caption: string | null
  thumbnailUrl: string | null
  permalink: string | null
  timestamp: Date
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  rank: number
}

/**
 * Get active profile
 */
async function getActiveProfile() {
  return await db.query.instagramProfiles.findFirst({
    where: eq(instagramProfiles.isActive, true),
  })
}

/**
 * Get top posts ranked by engagement rate
 * Returns empty array if no data available
 */
export async function getTopPosts(limit: number = 10): Promise<TopPostData[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    // Get all posts (IMAGE and CAROUSEL_ALBUM)
    const posts = await db.query.media.findMany({
      where: and(
        eq(media.profileId, profile.id),
        sql`${media.mediaType} IN ('IMAGE', 'CAROUSEL_ALBUM')`
      ),
      orderBy: [desc(media.timestamp)],
    })

    if (posts.length === 0) return []

    // Get latest metrics for each post and calculate engagement
    const postsWithMetrics: Array<{
      post: typeof posts[0]
      likes: number
      comments: number
      shares: number
      saves: number
      engagementRate: number
    }> = []

    for (const post of posts) {
      const latestMetric = await db.query.mediaMetricsDaily.findFirst({
        where: eq(mediaMetricsDaily.mediaId, post.id),
        orderBy: [desc(mediaMetricsDaily.metricDate)],
      })

      const likes = latestMetric?.likesCount ?? 0
      const comments = latestMetric?.commentsCount ?? 0
      const shares = latestMetric?.sharesCount ?? 0
      const saves = latestMetric?.savesCount ?? 0
      const engagementRate = latestMetric?.engagementRate
        ? parseFloat(latestMetric.engagementRate.toString())
        : 0

      postsWithMetrics.push({
        post,
        likes,
        comments,
        shares,
        saves,
        engagementRate,
      })
    }

    // Sort by engagement rate and take top N
    const topPosts = postsWithMetrics
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, limit)

    return topPosts.map((item, index) => ({
      id: item.post.id,
      instagramId: item.post.instagramId,
      caption: item.post.caption,
      thumbnailUrl: item.post.thumbnailUrl,
      permalink: item.post.permalink,
      timestamp: item.post.timestamp,
      likes: item.likes,
      comments: item.comments,
      shares: item.shares,
      saves: item.saves,
      engagementRate: item.engagementRate,
      rank: index + 1,
    }))
  } catch (error) {
    console.error("Error fetching top posts:", error)
    return []
  }
}

/**
 * Get top reels ranked by engagement rate
 * Returns empty array if no data available
 */
export async function getTopReels(limit: number = 10): Promise<TopReelData[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    // Get all reels (VIDEO)
    const reels = await db.query.media.findMany({
      where: and(eq(media.profileId, profile.id), eq(media.mediaType, "VIDEO")),
      orderBy: [desc(media.timestamp)],
    })

    if (reels.length === 0) return []

    // Get latest metrics for each reel and calculate engagement
    const reelsWithMetrics: Array<{
      reel: typeof reels[0]
      views: number
      likes: number
      comments: number
      shares: number
      saves: number
      engagementRate: number
    }> = []

    for (const reel of reels) {
      const latestMetric = await db.query.mediaMetricsDaily.findFirst({
        where: eq(mediaMetricsDaily.mediaId, reel.id),
        orderBy: [desc(mediaMetricsDaily.metricDate)],
      })

      const views = latestMetric?.impressions || 0
      const likes = latestMetric?.likesCount ?? 0
      const comments = latestMetric?.commentsCount ?? 0
      const shares = latestMetric?.sharesCount ?? 0
      const saves = latestMetric?.savesCount ?? 0
      const engagementRate = latestMetric?.engagementRate
        ? parseFloat(latestMetric.engagementRate.toString())
        : 0

      reelsWithMetrics.push({
        reel,
        views,
        likes,
        comments,
        shares,
        saves,
        engagementRate,
      })
    }

    // Sort by engagement rate and take top N
    const topReels = reelsWithMetrics
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, limit)

    return topReels.map((item, index) => ({
      id: item.reel.id,
      instagramId: item.reel.instagramId,
      caption: item.reel.caption,
      thumbnailUrl: item.reel.thumbnailUrl,
      permalink: item.reel.permalink,
      timestamp: item.reel.timestamp,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      shares: item.shares,
      saves: item.saves,
      engagementRate: item.engagementRate,
      rank: index + 1,
    }))
  } catch (error) {
    console.error("Error fetching top reels:", error)
    return []
  }
}
