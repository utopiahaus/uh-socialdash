import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Instagram className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connect Instagram</CardTitle>
          <CardDescription>
            Connect your Instagram account to start tracking your analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/api/auth/login">
              <Instagram className="mr-2 h-5 w-5" />
              Connect with Instagram
            </Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            By connecting, you authorize this app to access your Instagram
            insights and media data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
