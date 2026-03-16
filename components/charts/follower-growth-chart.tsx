"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts"
import { ChartCard } from "@/components/dashboard/chart-card"

interface FollowerGrowthChartProps {
  data: Array<{
    date: string
    followers: number
  }>
  title?: string
  description?: string
  className?: string
}

export function FollowerGrowthChart({
  data,
  title = "Follower Growth",
  description = "Daily follower count over time",
  className,
}: FollowerGrowthChartProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
          />
          <Line
            type="monotone"
            dataKey="followers"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Brush dataKey="date" height={30} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
