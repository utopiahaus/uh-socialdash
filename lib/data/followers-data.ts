/**
 * Followers Data Access
 *
 * Server-side data fetching for the followers analytics panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, metricsDaily } from "@/lib/db/schema"
import { eq, desc, and, gte, sql } from "drizzle-orm"
import { formatChartDate, getDateDaysAgo, calculatePercentageChange } from "./shared-data-utils"

/**
 * Followers metrics
 */
export interface FollowersMetrics {
  totalFollowers: number
  newFollowers: number
  unfollows: number
  growthRate: number
  followingCount: number
}

/**
 * Follower growth data point
 */
export interface FollowerGrowthDataPoint {
  date: string
  followers: number
  newFollowers: number
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
 * Get followers metrics
 * Returns null if no active profile exists
 */
export async function getFollowersMetrics(): Promise<FollowersMetrics | null> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return null

    // Get latest metrics
    const latestMetrics = await db.query.metricsDaily.findFirst({
      where: eq(metricsDaily.profileId, profile.id),
      orderBy: [desc(metricsDaily.metricDate)],
    })

    // Get metrics from 7 days ago for comparison
    const sevenDaysAgo = getDateDaysAgo(7)
    const weekAgoMetrics = await db.query.metricsDaily.findFirst({
      where: and(
        eq(metricsDaily.profileId, profile.id),
        gte(metricsDaily.metricDate, sevenDaysAgo.toISOString().split("T")[0])
      ),
      orderBy: [metricsDaily.metricDate],
    })

    // Get earliest metrics in the 7-day period for unfollow calculation
    const periodStart = sevenDaysAgo.toISOString().split("T")[0]
    const startMetrics = await db.query.metricsDaily.findFirst({
      where: and(
        eq(metricsDaily.profileId, profile.id),
        gte(metricsDaily.metricDate, periodStart)
      ),
      orderBy: [metricsDaily.metricDate],
    })

    const totalFollowers = latestMetrics?.followersCount ?? 0
    const previousFollowers = startMetrics?.followersCount ?? totalFollowers
    const newFollowers = totalFollowers - previousFollowers
    const growthRate = calculatePercentageChange(totalFollowers, previousFollowers)

    return {
      totalFollowers,
      newFollowers: Math.max(0, newFollowers),
      unfollows: Math.max(0, -newFollowers),
      growthRate,
      followingCount: latestMetrics?.followingCount ?? 0,
    }
  } catch (error) {
    console.error("Error fetching followers metrics:", error)
    return null
  }
}

/**
 * Get 30-day follower growth data
 * Returns empty array if no data available
 */
export async function getFollowersGrowthData(days: number = 30): Promise<FollowerGrowthDataPoint[]> {
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

    // Calculate new followers per day
    const result: FollowerGrowthDataPoint[] = []
    for (let i = 0; i < metrics.length; i++) {
      const current = metrics[i]
      const previous = metrics[i - 1]
      const newFollowers = previous
        ? current.followersCount - previous.followersCount
        : 0

      result.push({
        date: formatChartDate(current.metricDate),
        followers: current.followersCount,
        newFollowers: Math.max(0, newFollowers),
      })
    }

    return result
  } catch (error) {
    console.error("Error fetching followers growth data:", error)
    return []
  }
}
