import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart"
import { MetricCard } from "@/components/dashboard/metric-card"
import { TrendingUp, Heart, MessageCircle, Share2 } from "lucide-react"
import { getEngagementMetrics, getEngagementTrendData } from "@/lib/data/engagement-data"
import { formatNumber } from "@/lib/data/shared-data-utils"

export default async function EngagementPage() {
  const [metrics, trendData] = await Promise.all([
    getEngagementMetrics(),
    getEngagementTrendData(30),
  ])

  const hasData = metrics !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Engagement Analytics</h1>
        <p className="text-muted-foreground">
          Track your engagement metrics across all content
        </p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-lg font-medium">No engagement data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Instagram account to see engagement analytics
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Engagement Rate"
              value={`${metrics!.totalEngagementRate.toFixed(2)}%`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Likes/Post"
              value={formatNumber(metrics!.avgLikesPerPost)}
              icon={<Heart className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Comments/Post"
              value={formatNumber(metrics!.avgCommentsPerPost)}
              icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Shares/Post"
              value={formatNumber(metrics!.avgSharesPerPost)}
              icon={<Share2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <FollowerGrowthChart
            data={trendData.map((d) => ({
              date: d.date,
              followers: d.engagementRate,
            }))}
            title="Engagement Rate Trend"
            description="Daily engagement rate over time"
          />
        </>
      )}
    </div>
  )
}
