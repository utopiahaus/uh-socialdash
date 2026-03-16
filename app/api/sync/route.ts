import { NextRequest, NextResponse } from "next/server"
import { InstagramService } from "@/lib/services/instagram-service"

export async function POST(request: NextRequest) {
  try {
    const profile = await InstagramService.getActiveProfile()

    if (!profile) {
      return NextResponse.json(
        { error: "No active Instagram profile found" },
        { status: 404 }
      )
    }

    const service = new InstagramService(profile.accessToken!)

    await service.syncProfileData(profile.id)
    await service.syncMediaData(profile.id)
    await service.syncUserInsights(profile.id)

    return NextResponse.json({
      success: true,
      message: "Data synced successfully",
    })
  } catch (error) {
    console.error("Error syncing data:", error)
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    )
  }
}
