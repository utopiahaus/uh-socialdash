import cron from "node-cron"
import { InstagramService } from "@/lib/services/instagram-service"
import { tokenRefreshService } from "@/lib/services/token-refresh-service"
import { instagramProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"

let syncJob: cron.ScheduledTask | null = null
let tokenRefreshJob: cron.ScheduledTask | null = null

export async function startInstagramSyncScheduler() {
  if (syncJob) {
    console.log("Instagram sync scheduler already running")
    return
  }

  // Run every day at 2 AM
  syncJob = cron.schedule(
    "0 2 * * *",
    async () => {
      console.log("Starting Instagram data sync...")

      try {
        const profiles = await db.query.instagramProfiles.findMany({
          where: eq(instagramProfiles.isActive, true),
        })

        for (const profile of profiles) {
          if (!profile.accessToken) continue

          try {
            const service = new InstagramService(profile.accessToken)
            await service.syncProfileData(profile.id)
            await service.syncMediaData(profile.id)
            await service.syncUserInsights(profile.id)

            console.log(`Synced data for profile: ${profile.username}`)
          } catch (error) {
            console.error(`Failed to sync profile ${profile.username}:`, error)
          }
        }

        console.log("Instagram data sync completed")
      } catch (error) {
        console.error("Instagram sync error:", error)
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  )

  console.log("Instagram sync scheduler started")
}

export async function startTokenRefreshScheduler() {
  if (tokenRefreshJob) {
    console.log("Token refresh scheduler already running")
    return
  }

  // Run every day at 3 AM (after data sync)
  tokenRefreshJob = cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("Checking for tokens to refresh...")

      try {
        const result = await tokenRefreshService.refreshExpiredTokens()

        console.log(
          `Token refresh completed: ${result.refreshed} refreshed, ${result.failed} failed, ${result.checked} checked`
        )

        // Alert if any tokens failed to refresh
        if (result.failed > 0) {
          console.warn(
            `⚠️  Warning: ${result.failed} profile(s) failed to refresh and were marked inactive`
          )

          // TODO: Send notification to admin
        }
      } catch (error) {
        console.error("Token refresh error:", error)
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  )

  console.log("Token refresh scheduler started")
}

export function stopInstagramSyncScheduler() {
  if (syncJob) {
    syncJob.stop()
    syncJob = null
    console.log("Instagram sync scheduler stopped")
  }
}

export function stopTokenRefreshScheduler() {
  if (tokenRefreshJob) {
    tokenRefreshJob.stop()
    tokenRefreshJob = null
    console.log("Token refresh scheduler stopped")
  }
}

// For manual testing
export async function manualSync() {
  const profiles = await db.query.instagramProfiles.findMany({
    where: eq(instagramProfiles.isActive, true),
  })

  for (const profile of profiles) {
    if (!profile.accessToken) continue

    try {
      const service = new InstagramService(profile.accessToken)
      await service.syncProfileData(profile.id)
      await service.syncMediaData(profile.id)
      await service.syncUserInsights(profile.id)

      console.log(`Manual sync completed for: ${profile.username}`)
    } catch (error) {
      console.error(`Manual sync failed for ${profile.username}:`, error)
    }
  }
}
