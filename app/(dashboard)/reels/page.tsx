import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Video, Eye, Heart, MessageCircle } from "lucide-react"
import { getReelsMetrics, getReelsList } from "@/lib/data/reels-data"
import { formatNumber } from "@/lib/data/shared-data-utils"

export default async function ReelsPage() {
  const [metrics, reels] = await Promise.all([
    getReelsMetrics(),
    getReelsList(12),
  ])

  const hasData = metrics !== null && reels.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reels Analytics</h1>
        <p className="text-muted-foreground">
          Track your Reels performance and reach
        </p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-lg font-medium">No reels data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Instagram account to see reel analytics
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Reels"
              value={metrics!.totalReels.toString()}
              icon={<Video className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Views"
              value={formatNumber(metrics!.avgViews)}
              icon={<Eye className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Likes"
              value={formatNumber(metrics!.avgLikes)}
              icon={<Heart className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Comments"
              value={formatNumber(metrics!.avgComments)}
              icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reels.map((reel) => (
              <Card key={reel.id}>
                {reel.thumbnailUrl && (
                  <div className="h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption || "Reel"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-sm line-clamp-2">
                    {reel.caption || "Reel"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-semibold">{formatNumber(reel.views)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Likes</p>
                      <p className="font-semibold">{formatNumber(reel.likes)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comments</p>
                      <p className="font-semibold">{formatNumber(reel.comments)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{reel.engagementRate.toFixed(2)}%</p>
                    </div>
                  </div>
                  {reel.permalink && (
                    <a
                      href={reel.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      View on Instagram
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
