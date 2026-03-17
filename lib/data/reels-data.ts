/**
 * Reels Data Access
 *
 * Server-side data fetching for the reels analytics panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, media, mediaMetricsDaily } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { safeDivide, calculateAverage } from "./shared-data-utils"

/**
 * Reel metrics
 */
export interface ReelsMetrics {
  totalReels: number
  avgViews: number
  avgLikes: number
  avgComments: number
  avgEngagementRate: number
}

/**
 * Reel data with metrics
 */
export interface ReelData {
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
 * Get reels metrics (VIDEO type only)
 * Returns null if no active profile exists
 */
export async function getReelsMetrics(): Promise<ReelsMetrics | null> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return null

    // Count reels (VIDEO)
    const reelsCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(media)
      .where(and(eq(media.profileId, profile.id), eq(media.mediaType, "VIDEO")))

    const totalReels = reelsCountResult[0]?.count ?? 0

    if (totalReels === 0) {
      return {
        totalReels: 0,
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        avgEngagementRate: 0,
      }
    }

    // Get latest metrics for all reels
    const reelsIdsResult = await db
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.profileId, profile.id), eq(media.mediaType, "VIDEO")))

    const reelIds = reelsIdsResult.map((r) => r.id)

    // Get latest metrics for each reel
    const latestMetrics = await db.query.mediaMetricsDaily.findMany({
      where: sql`${mediaMetricsDaily.mediaId} IN ${sql.placeholder("ids")}`,
      orderBy: [desc(mediaMetricsDaily.metricDate)],
      limit: reelIds.length,
    })

    const views = latestMetrics.map((m) => m.impressions || 0)
    const likes = latestMetrics.map((m) => m.likesCount)
    const comments = latestMetrics.map((m) => m.commentsCount)
    const engagementRates = latestMetrics
      .map((m) => m.engagementRate?.toString())
      .filter((r): r is string => r !== undefined)
      .map((r) => parseFloat(r))

    return {
      totalReels,
      avgViews: Math.round(calculateAverage(views)),
      avgLikes: Math.round(calculateAverage(likes)),
      avgComments: Math.round(calculateAverage(comments)),
      avgEngagementRate: parseFloat(calculateAverage(engagementRates).toFixed(2)),
    }
  } catch (error) {
    console.error("Error fetching reels metrics:", error)
    return null
  }
}

/**
 * Get paginated reels list with latest metrics
 * Returns empty array if no data available
 */
export async function getReelsList(limit: number = 20, offset: number = 0): Promise<ReelData[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    // Get reels (VIDEO) with pagination
    const reels = await db.query.media.findMany({
      where: and(eq(media.profileId, profile.id), eq(media.mediaType, "VIDEO")),
      orderBy: [desc(media.timestamp)],
      limit,
      offset,
    })

    if (reels.length === 0) return []

    // Get latest metrics for each reel
    const result: ReelData[] = []

    for (const reel of reels) {
      const latestMetric = await db.query.mediaMetricsDaily.findFirst({
        where: eq(mediaMetricsDaily.mediaId, reel.id),
        orderBy: [desc(mediaMetricsDaily.metricDate)],
      })

      result.push({
        id: reel.id,
        instagramId: reel.instagramId,
        caption: reel.caption,
        thumbnailUrl: reel.thumbnailUrl,
        permalink: reel.permalink,
        timestamp: reel.timestamp,
        views: latestMetric?.impressions || 0,
        likes: latestMetric?.likesCount ?? 0,
        comments: latestMetric?.commentsCount ?? 0,
        shares: latestMetric?.sharesCount ?? 0,
        saves: latestMetric?.savesCount ?? 0,
        engagementRate: latestMetric?.engagementRate
          ? parseFloat(latestMetric.engagementRate.toString())
          : 0,
      })
    }

    return result
  } catch (error) {
    console.error("Error fetching reels list:", error)
    return []
  }
}
