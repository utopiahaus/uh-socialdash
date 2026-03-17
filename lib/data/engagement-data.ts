/**
 * Engagement Data Access
 *
 * Server-side data fetching for the engagement analytics panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, media, mediaMetricsDaily } from "@/lib/db/schema"
import { eq, desc, and, gte, sql } from "drizzle-orm"
import { formatChartDate, getDateDaysAgo, calculateAverage } from "./shared-data-utils"

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  totalEngagementRate: number
  avgLikesPerPost: number
  avgCommentsPerPost: number
  avgSharesPerPost: number
  totalLikes: number
  totalComments: number
  totalShares: number
}

/**
 * Engagement trend data point
 */
export interface EngagementTrendDataPoint {
  date: string
  engagementRate: number
  likes: number
  comments: number
  shares: number
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
 * Get overall engagement metrics
 * Returns null if no active profile exists
 */
export async function getEngagementMetrics(): Promise<EngagementMetrics | null> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return null

    // Get all media for this profile
    const allMedia = await db.query.media.findMany({
      where: eq(media.profileId, profile.id),
    })

    if (allMedia.length === 0) {
      return {
        totalEngagementRate: 0,
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0,
        avgSharesPerPost: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
      }
    }

    const mediaIds = allMedia.map((m) => m.id)

    // Get latest metrics for all media
    const latestMetrics = await db.query.mediaMetricsDaily.findMany({
      where: sql`${mediaMetricsDaily.mediaId} IN ${sql.placeholder("ids")}`,
    })

    // Aggregate totals
    const totalLikes = latestMetrics.reduce((sum, m) => sum + m.likesCount, 0)
    const totalComments = latestMetrics.reduce((sum, m) => sum + m.commentsCount, 0)
    const totalShares = latestMetrics.reduce((sum, m) => sum + m.sharesCount, 0)

    // Calculate averages
    const avgLikesPerPost = Math.round(totalLikes / allMedia.length)
    const avgCommentsPerPost = Math.round(totalComments / allMedia.length)
    const avgSharesPerPost = Math.round(totalShares / allMedia.length)

    // Calculate average engagement rate
    const engagementRates = latestMetrics
      .map((m) => m.engagementRate?.toString())
      .filter((r): r is string => r !== undefined)
      .map((r) => parseFloat(r))
    const totalEngagementRate = parseFloat(calculateAverage(engagementRates).toFixed(2))

    return {
      totalEngagementRate,
      avgLikesPerPost,
      avgCommentsPerPost,
      avgSharesPerPost,
      totalLikes,
      totalComments,
      totalShares,
    }
  } catch (error) {
    console.error("Error fetching engagement metrics:", error)
    return null
  }
}

/**
 * Get 30-day engagement trend data
 * Returns empty array if no data available
 */
export async function getEngagementTrendData(days: number = 30): Promise<EngagementTrendDataPoint[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    const startDate = getDateDaysAgo(days)
    const startDateStr = startDate.toISOString().split("T")[0]

    // Get daily media metrics and aggregate by date
    const dailyMetrics = await db.query.mediaMetricsDaily.findMany({
      where: gte(mediaMetricsDaily.metricDate, startDateStr),
      orderBy: [mediaMetricsDaily.metricDate],
    })

    // Group by date
    const groupedByDate = new Map<string, typeof dailyMetrics>()
    for (const metric of dailyMetrics) {
      const existing = groupedByDate.get(metric.metricDate) || []
      groupedByDate.set(metric.metricDate, [...existing, metric])
    }

    // Calculate daily aggregates
    const result: EngagementTrendDataPoint[] = []
    for (const [date, metrics] of groupedByDate) {
      const totalLikes = metrics.reduce((sum, m) => sum + m.likesCount, 0)
      const totalComments = metrics.reduce((sum, m) => sum + m.commentsCount, 0)
      const totalShares = metrics.reduce((sum, m) => sum + m.sharesCount, 0)

      const engagementRates = metrics
        .map((m) => m.engagementRate?.toString())
        .filter((r): r is string => r !== undefined)
        .map((r) => parseFloat(r))
      const avgEngagementRate = calculateAverage(engagementRates)

      result.push({
        date: formatChartDate(date),
        engagementRate: parseFloat(avgEngagementRate.toFixed(2)),
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
      })
    }

    return result
  } catch (error) {
    console.error("Error fetching engagement trend data:", error)
    return []
  }
}
