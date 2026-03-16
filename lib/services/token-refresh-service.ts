import { db } from "@/lib/db"
import { instagramProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { InstagramApiClient } from "@/lib/api/instagram-client"
import { encrypt, decrypt } from "@/lib/utils/crypto"
import { InstagramService } from "./instagram-service"

/**
 * Token Refresh Service
 * Handles automatic refresh of Instagram access tokens
 */
export class TokenRefreshService {
  /**
   * Check if a token needs refresh (expires within 7 days)
   * @param expiresAt - Token expiration date
   * @returns true if token should be refreshed
   */
  private shouldRefreshToken(expiresAt: Date | null): boolean {
    if (!expiresAt) return true

    const now = Date.now()
    const daysUntilExpiry = (expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)

    // Refresh if token expires in less than 7 days
    return daysUntilExpiry < 7
  }

  /**
   * Refresh a specific profile's access token
   * @param profileId - Profile ID to refresh token for
   * @returns true if refresh was successful
   */
  async refreshProfileToken(profileId: number): Promise<boolean> {
    try {
      const profile = await db.query.instagramProfiles.findFirst({
        where: eq(instagramProfiles.id, profileId),
      })

      if (!profile || !profile.accessToken) {
        console.log(`Profile ${profileId} not found or no access token`)
        return false
      }

      // Decrypt the token to use it
      const decryptedToken = decrypt(profile.accessToken)

      // Use Instagram API to refresh the token
      const client = new InstagramApiClient(decryptedToken)
      const refreshToken = await client.refreshToken(decryptedToken)

      // Calculate new expiration date
      const newExpiresAt = new Date(
        Date.now() + refreshToken.expires_in * 1000
      )

      // Update profile with new encrypted token
      await InstagramService.updateProfile(profileId, {
        accessToken: refreshToken.access_token,
        tokenExpiresAt: newExpiresAt,
      })

      console.log(
        `Successfully refreshed token for profile: ${profile.username}`
      )
      return true
    } catch (error) {
      console.error(`Failed to refresh token for profile ${profileId}:`, error)

      // Mark profile as inactive if refresh fails
      await db
        .update(instagramProfiles)
        .set({ isActive: false })
        .where(eq(instagramProfiles.id, profileId))

      return false
    }
  }

  /**
   * Check and refresh all active profiles that need token refresh
   * @returns Summary of refresh operations
   */
  async refreshExpiredTokens(): Promise<{
    checked: number
    refreshed: number
    failed: number
  }> {
    const profiles = await db.query.instagramProfiles.findMany({
      where: eq(instagramProfiles.isActive, true),
    })

    let refreshed = 0
    let failed = 0

    for (const profile of profiles) {
      if (this.shouldRefreshToken(profile.tokenExpiresAt)) {
        const success = await this.refreshProfileToken(profile.id)

        if (success) {
          refreshed++
        } else {
          failed++
        }
      }
    }

    return {
      checked: profiles.length,
      refreshed,
      failed,
    }
  }

  /**
   * Get profiles that need token refresh soon
   * @param daysThreshold - Days until expiration to check (default: 7)
   * @returns List of profiles that need attention
   */
  async getProfilesNeedingRefresh(daysThreshold: number = 7): Promise<
    Array<{
      id: number
      username: string
      tokenExpiresAt: Date | null
      daysUntilExpiry: number
    }>
  > {
    const profiles = await db.query.instagramProfiles.findMany({
      where: eq(instagramProfiles.isActive, true),
    })

    const now = Date.now()
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000

    return profiles
      .filter((p) => {
        if (!p.tokenExpiresAt) return true
        const timeUntilExpiry = p.tokenExpiresAt.getTime() - now
        return timeUntilExpiry < thresholdMs
      })
      .map((p) => ({
        id: p.id,
        username: p.username,
        tokenExpiresAt: p.tokenExpiresAt,
        daysUntilExpiry: p.tokenExpiresAt
          ? Math.round((p.tokenExpiresAt.getTime() - now) / (1000 * 60 * 60 * 24))
          : 0,
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
  }
}

export const tokenRefreshService = new TokenRefreshService()
