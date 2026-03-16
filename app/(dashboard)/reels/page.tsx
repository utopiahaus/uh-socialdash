import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Video, Eye, Heart, MessageCircle } from "lucide-react"

const mockReels = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  views: 5000 + i * 1000,
  likes: 300 + i * 50,
  comments: 20 + i * 5,
}))

export default function ReelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reels Analytics</h1>
        <p className="text-muted-foreground">
          Track your Reels performance and reach
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Reels"
          value="42"
          icon={<Video className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Views"
          value="8,500"
          change={15.3}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Likes"
          value="540"
          change={22.1}
          icon={<Heart className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Comments"
          value="45"
          change={18.7}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockReels.map((reel) => (
          <Card key={reel.id}>
            <CardHeader>
              <CardTitle className="text-sm">Reel #{reel.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Views</p>
                  <p className="font-semibold">{reel.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Likes</p>
                  <p className="font-semibold">{reel.likes}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Comments</p>
                  <p className="font-semibold">{reel.comments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
