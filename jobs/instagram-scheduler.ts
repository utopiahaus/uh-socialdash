import cron from "node-cron"
import { InstagramService } from "@/lib/services/instagram-service"
import { instagramProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"

let syncJob: cron.ScheduledTask | null = null

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

export function stopInstagramSyncScheduler() {
  if (syncJob) {
    syncJob.stop()
    syncJob = null
    console.log("Instagram sync scheduler stopped")
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
