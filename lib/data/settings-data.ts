/**
 * Settings Data Access
 *
 * Server-side data fetching for the settings panel.
 */

import { db } from "@/lib/db"
import { instagramProfiles, metricsDaily } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { formatTimestamp, getDaysRemaining } from "./shared-data-utils"

/**
 * Profile information
 */
export interface ProfileInfo {
  id: number
  username: string
  profilePicUrl: string | null
  biography: string | null
  websiteUrl: string | null
  isActive: boolean
  connectedAt: Date
}

/**
 * Token status
 */
export interface TokenStatus {
  isValid: boolean
  expiresAt: Date | null
  daysRemaining: number
  needsRefresh: boolean
}

/**
 * Sync status
 */
export interface SyncStatus {
  lastSyncAt: Date | null
  lastSyncFormatted: string
  hasData: boolean
}

/**
 * Complete settings data
 */
export interface SettingsData {
  profile: ProfileInfo | null
  token: TokenStatus
  sync: SyncStatus
}

/**
 * Get connected Instagram profile
 * Returns null if no active profile exists
 */
export async function getConnectedProfile(): Promise<ProfileInfo | null> {
  try {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.isActive, true),
    })

    if (!profile) return null

    return {
      id: profile.id,
      username: profile.username,
      profilePicUrl: profile.profilePicUrl,
      biography: profile.biography,
      websiteUrl: profile.websiteUrl,
      isActive: profile.isActive,
      connectedAt: profile.createdAt,
    }
  } catch (error) {
    console.error("Error fetching connected profile:", error)
    return null
  }
}

/**
 * Get token status
 */
export async function getTokenStatus(): Promise<TokenStatus> {
  try {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.isActive, true),
    })

    const isValid = !!profile && !!profile.accessToken
    const expiresAt = profile?.tokenExpiresAt || null
    const daysRemaining = getDaysRemaining(expiresAt)
    const needsRefresh = daysRemaining <= 7

    return {
      isValid,
      expiresAt,
      daysRemaining,
      needsRefresh,
    }
  } catch (error) {
    console.error("Error fetching token status:", error)
    return {
      isValid: false,
      expiresAt: null,
      daysRemaining: 0,
      needsRefresh: true,
    }
  }
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<SyncStatus> {
  try {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.isActive, true),
    })

    if (!profile) {
      return {
        lastSyncAt: null,
        lastSyncFormatted: "Never",
        hasData: false,
      }
    }

    // Get latest metric date as proxy for last sync
    const latestMetric = await db.query.metricsDaily.findFirst({
      where: eq(metricsDaily.profileId, profile.id),
      orderBy: [desc(metricsDaily.metricDate)],
    })

    const lastSyncAt = latestMetric?.createdAt || null
    const lastSyncFormatted = lastSyncAt
      ? formatTimestamp(lastSyncAt)
      : "Never"
    const hasData = !!latestMetric

    return {
      lastSyncAt,
      lastSyncFormatted,
      hasData,
    }
  } catch (error) {
    console.error("Error fetching last sync time:", error)
    return {
      lastSyncAt: null,
      lastSyncFormatted: "Unknown",
      hasData: false,
    }
  }
}

/**
 * Get complete settings data
 * Returns null if no active profile exists
 */
export async function getSettingsData(): Promise<SettingsData | null> {
  try {
    const profile = await getConnectedProfile()
    if (!profile) return null

    const token = await getTokenStatus()
    const sync = await getLastSyncTime()

    return {
      profile,
      token,
      sync,
    }
  } catch (error) {
    console.error("Error fetching settings data:", error)
    return null
  }
}
