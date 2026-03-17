import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Image as ImageIcon, Heart, MessageCircle, Share2 } from "lucide-react"
import { getPostsMetrics, getPostsList } from "@/lib/data/posts-data"
import { formatNumber } from "@/lib/data/shared-data-utils"

export default async function PostsPage() {
  const [metrics, posts] = await Promise.all([
    getPostsMetrics(),
    getPostsList(12),
  ])

  const hasData = metrics !== null && posts.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your post performance and engagement
        </p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-lg font-medium">No posts data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Instagram account to see post analytics
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Posts"
              value={metrics!.totalPosts.toString()}
              icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
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
            <MetricCard
              title="Avg Shares"
              value={formatNumber(metrics!.avgShares)}
              icon={<Share2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id}>
                {post.thumbnailUrl && (
                  <div className="h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.caption || "Post"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-sm line-clamp-2">
                    {post.caption || "No caption"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Likes</p>
                      <p className="font-semibold">{formatNumber(post.likes)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comments</p>
                      <p className="font-semibold">{formatNumber(post.comments)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shares</p>
                      <p className="font-semibold">{formatNumber(post.shares)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{post.engagementRate.toFixed(2)}%</p>
                    </div>
                  </div>
                  {post.permalink && (
                    <a
                      href={post.permalink}
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
