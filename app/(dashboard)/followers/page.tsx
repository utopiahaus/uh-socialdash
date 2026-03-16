import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Users, UserPlus, UserMinus } from "lucide-react"

const mockData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  ),
  followers: 12000 + i * 17 + Math.floor(Math.random() * 50),
}))

export default function FollowersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Followers Analytics</h1>
        <p className="text-muted-foreground">
          Track your follower growth and demographics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Followers"
          value="12,500"
          change={5.2}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="New Followers (7d)"
          value="+342"
          change={12.5}
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Unfollows (7d)"
          value="28"
          change={-8.3}
          icon={<UserMinus className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <FollowerGrowthChart data={mockData} className="md:col-span-2" />
    </div>
  )
}
