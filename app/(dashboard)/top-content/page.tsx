import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Award, Trophy } from "lucide-react"

const mockTopPosts = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  caption: `Top performing post ${i + 1}`,
  likes: 5000 - i * 500,
  comments: 200 - i * 20,
  engagement: ((5000 - i * 500 + 200 - i * 20) / 10000 * 100).toFixed(2),
}))

const mockTopReels = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  views: 50000 - i * 5000,
  likes: 2000 - i * 200,
  engagement: ((2000 - i * 200) / (50000 - i * 5000) * 100).toFixed(2),
}))

export default function TopContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Top Content</h1>
        <p className="text-muted-foreground">
          Your best performing posts and reels
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Top Posts</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockTopPosts.map((post, index) => (
            <Card key={post.id} className="relative">
              {index === 0 && (
                <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 p-2">
                  <Award className="h-4 w-4 text-white" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  #{index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-2 text-sm">{post.caption}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Likes</p>
                    <p className="font-semibold">{post.likes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comments</p>
                    <p className="font-semibold">{post.comments}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="font-semibold">{post.engagement}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold">Top Reels</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockTopReels.map((reel, index) => (
            <Card key={reel.id} className="relative">
              {index === 0 && (
                <div className="absolute -right-2 -top-2 rounded-full bg-purple-500 p-2">
                  <Award className="h-4 w-4 text-white" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-500" />
                  #{index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-semibold">{reel.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Likes</p>
                    <p className="font-semibold">{reel.likes.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="font-semibold">{reel.engagement}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
