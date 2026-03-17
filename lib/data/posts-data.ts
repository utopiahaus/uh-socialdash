/**
 * Posts Data Access
 *
 * Server-side data fetching for the posts analytics panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, media, mediaMetricsDaily } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { safeDivide, calculateAverage } from "./shared-data-utils"

/**
 * Post metrics
 */
export interface PostsMetrics {
  totalPosts: number
  avgLikes: number
  avgComments: number
  avgShares: number
  avgEngagementRate: number
}

/**
 * Post data with metrics
 */
export interface PostData {
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
 * Get posts metrics (IMAGE and CAROUSEL_ALBUM only)
 * Returns null if no active profile exists
 */
export async function getPostsMetrics(): Promise<PostsMetrics | null> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return null

    // Count posts (IMAGE and CAROUSEL_ALBUM)
    const postsCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(media)
      .where(
        and(
          eq(media.profileId, profile.id),
          sql`${media.mediaType} IN ('IMAGE', 'CAROUSEL_ALBUM')`
        )
      )

    const totalPosts = postsCountResult[0]?.count ?? 0

    // Get latest metrics for all posts
    const postIdsResult = await db
      .select({ id: media.id })
      .from(media)
      .where(
        and(
          eq(media.profileId, profile.id),
          sql`${media.mediaType} IN ('IMAGE', 'CAROUSEL_ALBUM')`
        )
      )

    if (postIdsResult.length === 0) {
      return {
        totalPosts: 0,
        avgLikes: 0,
        avgComments: 0,
        avgShares: 0,
        avgEngagementRate: 0,
      }
    }

    const postIds = postIdsResult.map((p) => p.id)

    // Get latest metrics for each post
    const latestMetrics = await db.query.mediaMetricsDaily.findMany({
      where: sql`${mediaMetricsDaily.mediaId} IN ${sql.placeholder("ids")}`,
      orderBy: [desc(mediaMetricsDaily.metricDate)],
      limit: postIdsResult.length,
    })

    const likes = latestMetrics.map((m) => m.likesCount)
    const comments = latestMetrics.map((m) => m.commentsCount)
    const shares = latestMetrics.map((m) => m.sharesCount)
    const engagementRates = latestMetrics
      .map((m) => m.engagementRate?.toString())
      .filter((r): r is string => r !== undefined)
      .map((r) => parseFloat(r))

    return {
      totalPosts,
      avgLikes: Math.round(calculateAverage(likes)),
      avgComments: Math.round(calculateAverage(comments)),
      avgShares: Math.round(calculateAverage(shares)),
      avgEngagementRate: parseFloat(calculateAverage(engagementRates).toFixed(2)),
    }
  } catch (error) {
    console.error("Error fetching posts metrics:", error)
    return null
  }
}

/**
 * Get paginated posts list with latest metrics
 * Returns empty array if no data available
 */
export async function getPostsList(limit: number = 20, offset: number = 0): Promise<PostData[]> {
  try {
    const profile = await getActiveProfile()
    if (!profile) return []

    // Get posts (IMAGE and CAROUSEL_ALBUM) with pagination
    const posts = await db.query.media.findMany({
      where: and(
        eq(media.profileId, profile.id),
        sql`${media.mediaType} IN ('IMAGE', 'CAROUSEL_ALBUM')`
      ),
      orderBy: [desc(media.timestamp)],
      limit,
      offset,
    })

    if (posts.length === 0) return []

    // Get latest metrics for each post
    const result: PostData[] = []

    for (const post of posts) {
      const latestMetric = await db.query.mediaMetricsDaily.findFirst({
        where: eq(mediaMetricsDaily.mediaId, post.id),
        orderBy: [desc(mediaMetricsDaily.metricDate)],
      })

      result.push({
        id: post.id,
        instagramId: post.instagramId,
        caption: post.caption,
        thumbnailUrl: post.thumbnailUrl,
        permalink: post.permalink,
        timestamp: post.timestamp,
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
    console.error("Error fetching posts list:", error)
    return []
  }
}
