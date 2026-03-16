import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart"
import { MetricCard } from "@/components/dashboard/metric-card"
import { TrendingUp, Heart, MessageCircle, Share2 } from "lucide-react"

const mockEngagementData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  ),
  followers: 4 + Math.random() * 2,
}))

export default function EngagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Engagement Analytics</h1>
        <p className="text-muted-foreground">
          Track your engagement metrics across all content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Engagement Rate"
          value="4.8%"
          change={1.2}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Likes/Post"
          value="1,245"
          change={8.2}
          icon={<Heart className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Comments/Post"
          value="67"
          change={12.1}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Shares/Post"
          value="24"
          change={5.4}
          icon={<Share2 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <FollowerGrowthChart
        data={mockEngagementData}
        title="Engagement Rate Trend"
        description="Daily engagement rate over time"
      />
    </div>
  )
}
