import { MetricCard } from "@/components/dashboard/metric-card"
import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart"
import { Users, Image as ImageIcon, Video, TrendingUp } from "lucide-react"

// Mock data - replace with real API calls
const mockMetrics = {
  followers: 12500,
  followersChange: 5.2,
  posts: 248,
  engagement: 4.8,
}

const mockFollowerData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  ),
  followers: 12000 + i * 17 + Math.floor(Math.random() * 50),
}))

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Instagram performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Followers"
          value={mockMetrics.followers.toLocaleString()}
          change={mockMetrics.followersChange}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Posts"
          value={mockMetrics.posts}
          icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Reels"
          value="42"
          icon={<Video className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${mockMetrics.engagement}%`}
          change={1.2}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FollowerGrowthChart data={mockFollowerData} />
        <FollowerGrowthChart
          data={mockFollowerData}
          title="Engagement Trends"
          description="Daily engagement rate"
        />
      </div>
    </div>
  )
}
