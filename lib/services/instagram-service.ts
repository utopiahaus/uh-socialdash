import { db } from "@/lib/db"
import {
  instagramProfiles,
  metricsDaily,
  media,
  mediaMetricsDaily,
  type InstagramProfile,
  type NewInstagramProfile,
  type NewMetricsDaily,
  type NewMedia,
  type NewMediaMetricsDaily,
} from "@/lib/db/schema"
import { InstagramApiClient } from "@/lib/api/instagram-client"
import { eq, desc, and, sql } from "drizzle-orm"
import { encrypt, decrypt } from "@/lib/utils/crypto"

export class InstagramService {
  private client: InstagramApiClient
  private decryptedAccessToken: string

  constructor(encryptedAccessToken: string) {
    // Decrypt the token before using it
    this.decryptedAccessToken = decrypt(encryptedAccessToken)
    this.client = new InstagramApiClient(this.decryptedAccessToken)
  }

  async syncProfileData(profileId: number): Promise<void> {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.id, profileId),
    })

    if (!profile) {
      throw new Error("Profile not found")
    }

    const userProfile = await this.client.getUserProfile(profile.instagramId)
    const today = new Date().toISOString().split("T")[0]

    await db.insert(metricsDaily).values({
      profileId: profile.id,
      metricDate: today,
      followersCount: userProfile.followers_count,
      followingCount: userProfile.follows_count,
      postsCount: userProfile.media_count,
    } satisfies NewMetricsDaily).onConflictDoNothing()

    await db
      .update(instagramProfiles)
      .set({
        username: userProfile.username,
        profilePicUrl: userProfile.profile_picture_url,
        biography: userProfile.biography,
        websiteUrl: userProfile.website_url,
        updatedAt: new Date(),
      })
      .where(eq(instagramProfiles.id, profileId))
  }

  async syncMediaData(profileId: number): Promise<void> {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.id, profileId),
    })

    if (!profile) {
      throw new Error("Profile not found")
    }

    const mediaList = await this.client.getUserMedia(profile.instagramId)
    const today = new Date().toISOString().split("T")[0]

    for (const mediaItem of mediaList) {
      const existingMedia = await db.query.media.findFirst({
        where: eq(media.instagramId, mediaItem.id),
      })

      let mediaId: number

      if (!existingMedia) {
        const [newMedia] = await db
          .insert(media)
          .values({
            profileId: profile.id,
            instagramId: mediaItem.id,
            mediaType: mediaItem.media_type,
            caption: mediaItem.caption,
            permalink: mediaItem.permalink,
            thumbnailUrl: mediaItem.thumbnail_url || mediaItem.media_url,
            timestamp: new Date(mediaItem.timestamp),
          } satisfies NewMedia)
          .returning()
        mediaId = newMedia.id
      } else {
        mediaId = existingMedia.id
      }

      try {
        const insights = await this.client.getMediaInsights(mediaItem.id)

        await db
          .insert(mediaMetricsDaily)
          .values({
            mediaId,
            metricDate: today,
            likesCount: insights.likes,
            commentsCount: insights.comments,
            sharesCount: insights.shares,
            savesCount: insights.saves,
            impressions: insights.impressions,
            reach: insights.reach,
            engagementRate: insights.engagement_rate.toString(),
          } satisfies NewMediaMetricsDaily)
          .onConflictDoNothing()
      } catch (error) {
        console.error(`Failed to fetch insights for media ${mediaItem.id}:`, error)
      }
    }
  }

  async syncUserInsights(profileId: number): Promise<void> {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.id, profileId),
    })

    if (!profile) {
      throw new Error("Profile not found")
    }

    try {
      const insights = await this.client.getUserInsights(profile.instagramId)
      const today = new Date().toISOString().split("T")[0]

      await db
        .update(metricsDaily)
        .set({
          impressions: insights.impressions,
          reach: insights.reach,
          profileViews: insights.profile_views,
          websiteClicks: insights.website_clicks,
        })
        .where(
          and(
            eq(metricsDaily.profileId, profileId),
            eq(metricsDaily.metricDate, today)
          )
        )
    } catch (error) {
      console.error("Failed to fetch user insights:", error)
    }
  }

  static async getActiveProfile(): Promise<InstagramProfile | null> {
    const profiles = await db.query.instagramProfiles.findMany({
      where: eq(instagramProfiles.isActive, true),
      limit: 1,
    })

    return profiles[0] || null
  }

  static async createProfile(
    data: Omit<NewInstagramProfile, "accessToken" | "tokenExpiresAt"> & {
      accessToken: string
      tokenExpiresAt?: Date
    }
  ): Promise<InstagramProfile> {
    // Encrypt the access token before storing
    const encryptedToken = encrypt(data.accessToken)

    const [profile] = await db
      .insert(instagramProfiles)
      .values({
        ...data,
        accessToken: encryptedToken,
      } as NewInstagramProfile)
      .returning()

    return profile
  }

  static async updateProfile(
    id: number,
    data: Partial<NewInstagramProfile>
  ): Promise<InstagramProfile | null> {
    // If accessToken is being updated, encrypt it
    const updateData: Partial<NewInstagramProfile> = { ...data }

    if (data.accessToken) {
      updateData.accessToken = encrypt(data.accessToken)
    }

    const [profile] = await db
      .update(instagramProfiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(instagramProfiles.id, id))
      .returning()

    return profile || null
  }
}
