import { NextRequest, NextResponse } from "next/server"
import { InstagramService } from "@/lib/services/instagram-service"
import { metricsDaily } from "@/lib/db/schema"
import { eq, desc, gte, and } from "drizzle-orm"
import { db } from "@/lib/db"

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
    const days = parseInt(searchParams.get("days") || "30")
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const metrics = await db.query.metricsDaily.findMany({
      where: and(
        eq(metricsDaily.profileId, profile.id),
        gte(metricsDaily.metricDate, startDate.toISOString().split("T")[0])
      ),
      orderBy: [desc(metricsDaily.metricDate)],
      limit: days,
    })

    return NextResponse.json({ profile, metrics })
  } catch (error) {
    console.error("Error fetching profile metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile metrics" },
      { status: 500 }
    )
  }
}
