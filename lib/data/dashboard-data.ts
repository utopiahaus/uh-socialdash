/**
 * Dashboard Data Access
 *
 * Server-side data fetching for the main dashboard overview panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, metricsDaily, media } from "@/lib/db/schema"
import { eq, desc, and, gte, sql, count } from "drizzle-orm"
import {
  formatChartDate,
  getDateDaysAgo,
  calculateEngagementRate,
  safeDivide,
} from "./shared-data-utils"

/**
 * Dashboard overview metrics
 */
export interface DashboardMetrics {
  followers: number
  posts: number
  reels: number
  engagementRate: number
  followersChange: number
  postsChange: number
  impressions: number
  reach: number
}

/**
 * Follower growth data point
 */
export interface FollowerGrowthData {
  date: string
  followers: number
}

/**
 * Engagement trend data point
 */
export interface EngagementTrendData {
  date: string
  engagement: number
}

/**
 * Get active Instagram profile
 */
async function getActiveProfile() {
  return await db.query.instagramProfiles.findFirst({
    where: eq(instagramProfiles.isActive, true),
  })
}

/**
 * Get overview metrics for dashboard
 * Returns null if no active profile exists
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return null

    // Get latest and previous metrics (for change calculation)
    const latestMetrics = await db.query.metricsDaily.findFirst({
      where: eq(metricsDaily.profileId, profile.id),
      orderBy: [desc(metricsDaily.metricDate)],
    })

    const previousMetrics = await db.query.metricsDaily.findFirst({
      where: eq(metricsDaily.profileId, profile.id),
      orderBy: [desc(metricsDaily.metricDate)],
    })

    // Get previous day's metrics for change calculation
    const sevenDaysAgo = getDateDaysAgo(7)
    const weekAgoMetrics = await db.query.metricsDaily.findFirst({
      where: and(
        eq(metricsDaily.profileId, profile.id),
        gte(metricsDaily.metricDate, sevenDaysAgo.toISOString().split("T")[0])
      ),
      orderBy: [metricsDaily.metricDate],
    })

    // Count reels (VIDEO type media)
    const reelsResult = await db
      .select({ count: count() })
      .from(media)
      .where(and(eq(media.profileId, profile.id), eq(media.mediaType, "VIDEO")))

    // Calculate engagement rate from latest metrics
    const engagementRate = latestMetrics
      ? calculateEngagementRate(
          // Using impressions as proxy for engagement reach
          latestMetrics.impressions || 0,
          0,
          0,
          latestMetrics.followersCount
        )
      : 0

    return {
      followers: latestMetrics?.followersCount ?? 0,
      posts: latestMetrics?.postsCount ?? 0,
      reels: reelsResult[0]?.count ?? 0,
      engagementRate,
      followersChange: weekAgoMetrics && latestMetrics
        ? latestMetrics.followersCount - weekAgoMetrics.followersCount
        : 0,
      postsChange: weekAgoMetrics && latestMetrics
        ? latestMetrics.postsCount - weekAgoMetrics.postsCount
        : 0,
      impressions: latestMetrics?.impressions ?? 0,
      reach: latestMetrics?.reach ?? 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return null
  }
}

/**
 * Get 30-day follower growth data
 * Returns empty array if no data available
 */
export async function getFollowerGrowthData(days: number = 30): Promise<FollowerGrowthData[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    const startDate = getDateDaysAgo(days)
    const startDateStr = startDate.toISOString().split("T")[0]

    const metrics = await db.query.metricsDaily.findMany({
      where: and(
        eq(metricsDaily.profileId, profile.id),
        gte(metricsDaily.metricDate, startDateStr)
      ),
      orderBy: [metricsDaily.metricDate],
      limit: days,
    })

    return metrics.map((m) => ({
      date: formatChartDate(m.metricDate),
      followers: m.followersCount,
    }))
  } catch (error) {
    console.error("Error fetching follower growth data:", error)
    return []
  }
}

/**
 * Get 30-day engagement trend data
 * Returns empty array if no data available
 */
export async function getEngagementTrendData(days: number = 30): Promise<EngagementTrendData[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    const startDate = getDateDaysAgo(days)
    const startDateStr = startDate.toISOString().split("T")[0]

    const metrics = await db.query.metricsDaily.findMany({
      where: and(
        eq(metricsDaily.profileId, profile.id),
        gte(metricsDaily.metricDate, startDateStr)
      ),
      orderBy: [metricsDaily.metricDate],
      limit: days,
    })

    return metrics.map((m) => ({
      date: formatChartDate(m.metricDate),
      engagement: safeDivide(
        (m.impressions || 0) + (m.reach || 0),
        m.followersCount || 1
      ),
    }))
  } catch (error) {
    console.error("Error fetching engagement trend data:", error)
    return []
  }
}
