import { MetricCard } from "@/components/dashboard/metric-card"
import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart"
import { Users, Image as ImageIcon, Video, TrendingUp } from "lucide-react"
import {
  getDashboardMetrics,
  getFollowerGrowthData,
  getEngagementTrendData,
} from "@/lib/data/dashboard-data"

export default async function DashboardPage() {
  // Fetch real data from database
  const [metrics, followerData, engagementData] = await Promise.all([
    getDashboardMetrics(),
    getFollowerGrowthData(30),
    getEngagementTrendData(30),
  ])

  // Handle empty state
  const hasData = metrics !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Instagram performance
        </p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-lg font-medium">No Instagram account connected</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Instagram account to see your analytics
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Followers"
              value={metrics!.followers.toLocaleString()}
              change={metrics!.followersChange}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Total Posts"
              value={metrics!.posts.toString()}
              change={metrics!.postsChange}
              icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Reels"
              value={metrics!.reels.toString()}
              icon={<Video className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Engagement Rate"
              value={`${metrics!.engagementRate.toFixed(2)}%`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FollowerGrowthChart data={followerData} />
            <FollowerGrowthChart
              data={engagementData.map((d) => ({
                date: d.date,
                followers: d.engagement,
              }))}
              title="Engagement Trends"
              description="Daily engagement rate"
            />
          </div>
        </>
      )}
    </div>
  )
}
