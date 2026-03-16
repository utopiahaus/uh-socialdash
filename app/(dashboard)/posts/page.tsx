import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Image as ImageIcon, Heart, MessageCircle, Share2 } from "lucide-react"

const mockPosts = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  caption: `Post caption ${i + 1}`,
  likes: 1200 + i * 200,
  comments: 45 + i * 10,
  shares: 20 + i * 5,
  engagement: ((1200 + i * 200 + 45 + i * 10) / 5000 * 100).toFixed(2),
}))

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your post performance and engagement
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Posts"
          value="248"
          icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Likes"
          value="1,245"
          change={8.2}
          icon={<Heart className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Comments"
          value="67"
          change={12.1}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Shares"
          value="24"
          change={5.4}
          icon={<Share2 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle className="text-sm line-clamp-2">{post.caption}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Likes</p>
                  <p className="font-semibold">{post.likes.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comments</p>
                  <p className="font-semibold">{post.comments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shares</p>
                  <p className="font-semibold">{post.shares}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Engagement</p>
                  <p className="font-semibold">{post.engagement}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
