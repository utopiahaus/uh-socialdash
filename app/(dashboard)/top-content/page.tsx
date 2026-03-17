import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Award, Trophy } from "lucide-react"
import { getTopPosts, getTopReels } from "@/lib/data/top-content-data"
import { formatNumber } from "@/lib/data/shared-data-utils"

export default async function TopContentPage() {
  const [topPosts, topReels] = await Promise.all([
    getTopPosts(6),
    getTopReels(6),
  ])

  const hasData = topPosts.length > 0 || topReels.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Top Content</h1>
        <p className="text-muted-foreground">
          Your best performing posts and reels
        </p>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-lg font-medium">No content data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Instagram account to see your top content
            </p>
          </div>
        </div>
      ) : (
        <>
          {topPosts.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Top Posts</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topPosts.map((post, index) => (
                  <Card key={post.id} className="relative">
                    {index === 0 && (
                      <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 p-2">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                    )}
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
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        #{post.rank}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 line-clamp-2 text-sm">{post.caption || "No caption"}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
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
            </div>
          )}

          {topReels.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Top Reels</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topReels.map((reel, index) => (
                  <Card key={reel.id} className="relative">
                    {index === 0 && (
                      <div className="absolute -right-2 -top-2 rounded-full bg-purple-500 p-2">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {reel.thumbnailUrl && (
                      <div className="h-48 w-full overflow-hidden rounded-t-lg">
                        <img
                          src={reel.thumbnailUrl}
                          alt={reel.caption || "Reel"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-purple-500" />
                        #{reel.rank}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Views</p>
                          <p className="font-semibold">{formatNumber(reel.views)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Likes</p>
                          <p className="font-semibold">{formatNumber(reel.likes)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Comments</p>
                          <p className="font-semibold">{formatNumber(reel.comments)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Engagement</p>
                          <p className="font-semibold">{reel.engagementRate.toFixed(2)}%</p>
                        </div>
                      </div>
                      {reel.permalink && (
                        <a
                          href={reel.permalink}
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
