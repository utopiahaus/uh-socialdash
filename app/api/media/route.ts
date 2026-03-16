import { NextRequest, NextResponse } from "next/server"
import { media, mediaMetricsDaily } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { InstagramService } from "@/lib/services/instagram-service"

export async function GET(request: NextRequest) {
  try {
    const profile = await InstagramService.getActiveProfile()

    if (!profile) {
      return NextResponse.json(
        { error: "No active Instagram profile found" },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const mediaType = searchParams.get("mediaType")
    const limit = parseInt(searchParams.get("limit") || "20")

    const mediaList = await db.query.media.findMany({
      where: eq(media.profileId, profile.id),
      orderBy: [desc(media.timestamp)],
      limit,
      with: {
        mediaMetricsDaily: true,
      },
    })

    const filteredMedia = mediaType
      ? mediaList.filter((m: { mediaType: string }) => m.mediaType === mediaType)
      : mediaList

    return NextResponse.json({ media: filteredMedia })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    )
  }
}
