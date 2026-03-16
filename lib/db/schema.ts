import {
  pgTable,
  serial,
  bigint,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const mediaTypeEnum = pgEnum("media_type", [
  "CAROUSEL_ALBUM",
  "IMAGE",
  "VIDEO",
])

export const statusEnum = pgEnum("status", [
  "active",
  "archived",
  "deleted",
])

export const instagramProfiles = pgTable(
  "instagram_profiles",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    instagramId: text("instagram_id").notNull().unique(),
    username: text("username").notNull().unique(),
    profilePicUrl: text("profile_pic_url"),
    biography: text("biography"),
    websiteUrl: text("website_url"),
    isActive: boolean("is_active").default(true).notNull(),
    accessToken: text("access_token"), // AES-256-GCM encrypted token
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index("instagram_profiles_username_idx").on(table.username),
    activeIdx: index("instagram_profiles_active_idx").on(table.isActive),
  })
)

export const metricsDaily = pgTable(
  "metrics_daily",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    profileId: bigint("profile_id", { mode: "number" })
      .references(() => instagramProfiles.id, { onDelete: "cascade" })
      .notNull(),
    metricDate: text("metric_date").notNull(),
    followersCount: integer("followers_count").default(0).notNull(),
    followingCount: integer("following_count").default(0).notNull(),
    postsCount: integer("posts_count").default(0).notNull(),
    impressions: integer("impressions").default(0),
    reach: integer("reach").default(0),
    profileViews: integer("profile_views").default(0),
    websiteClicks: integer("website_clicks").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileDateUnique: uniqueIndex("metrics_daily_profile_date_unique").on(
      table.profileId,
      table.metricDate
    ),
    profileDateIdx: index("metrics_daily_profile_date_idx").on(
      table.profileId,
      table.metricDate
    ),
    dateIdx: index("metrics_daily_date_idx").on(table.metricDate),
  })
)

export const media = pgTable(
  "media",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    profileId: bigint("profile_id", { mode: "number" })
      .references(() => instagramProfiles.id, { onDelete: "cascade" })
      .notNull(),
    instagramId: text("instagram_id").notNull().unique(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    caption: text("caption"),
    permalink: text("permalink"),
    thumbnailUrl: text("thumbnail_url"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    status: statusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    profileTimestampIdx: index("media_profile_timestamp_idx").on(
      table.profileId,
      table.timestamp
    ),
    statusIdx: index("media_status_idx").on(table.status),
  })
)

export const mediaMetricsDaily = pgTable(
  "media_metrics_daily",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    mediaId: bigint("media_id", { mode: "number" })
      .references(() => media.id, { onDelete: "cascade" })
      .notNull(),
    metricDate: text("metric_date").notNull(),
    likesCount: integer("likes_count").default(0).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    sharesCount: integer("shares_count").default(0).notNull(),
    savesCount: integer("saves_count").default(0).notNull(),
    impressions: integer("impressions").default(0),
    reach: integer("reach").default(0),
    engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    mediaDateUnique: uniqueIndex("media_metrics_daily_media_date_unique").on(
      table.mediaId,
      table.metricDate
    ),
    mediaDateIdx: index("media_metrics_daily_media_date_idx").on(
      table.mediaId,
      table.metricDate
    ),
    engagementIdx: index("media_metrics_daily_engagement_idx").on(
      table.metricDate,
      table.engagementRate
    ),
  })
)

export type InstagramProfile = typeof instagramProfiles.$inferSelect
export type NewInstagramProfile = typeof instagramProfiles.$inferInsert
export type MetricsDaily = typeof metricsDaily.$inferSelect
export type NewMetricsDaily = typeof metricsDaily.$inferInsert
export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert
export type MediaMetricsDaily = typeof mediaMetricsDaily.$inferSelect
export type NewMediaMetricsDaily = typeof mediaMetricsDaily.$inferInsert
