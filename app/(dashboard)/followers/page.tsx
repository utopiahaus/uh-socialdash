import { FollowerGrowthChart } from "@/components/charts/follower-growth-chart"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Users, UserPlus, UserMinus } from "lucide-react"
import { getFollowersMetrics, getFollowersGrowthData } from "@/lib/data/followers-data"
import { formatNumber } from "@/lib/data/shared-data-utils"

export default async function FollowersPage() {
  const [metrics, growthData] = await Promise.all([
    getFollowersMetrics(),
    getFollowersGrowthData(30),
  ])

  const hasData = metrics !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Followers Analytics</h1>
        <p className="text-muted-foreground">
          Track your follower growth and demographics
        </p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-lg font-medium">No follower data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Instagram account to see follower analytics
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Followers"
              value={formatNumber(metrics!.totalFollowers)}
              change={metrics!.growthRate}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="New Followers (7d)"
              value={`+${formatNumber(metrics!.newFollowers)}`}
              icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Unfollows (7d)"
              value={formatNumber(metrics!.unfollows)}
              icon={<UserMinus className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <FollowerGrowthChart
            data={growthData.map((d) => ({
              date: d.date,
              followers: d.followers,
            }))}
            className="md:col-span-2"
          />
        </>
      )}
    </div>
  )
}
