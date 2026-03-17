import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Settings as SettingsIcon, Instagram, Database, Key, RefreshCw, AlertCircle } from "lucide-react"
import { getSettingsData } from "@/lib/data/settings-data"
import { formatTimestamp } from "@/lib/data/shared-data-utils"

export default async function SettingsPage() {
  const settingsData = await getSettingsData()
  const hasProfile = settingsData !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      {!hasProfile ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              No Account Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't connected your Instagram account yet.
            </p>
            <Button asChild>
              <a href="/api/auth/login">Connect Instagram Account</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Instagram Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Connected Account</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">@{settingsData!.profile!.username}</p>
                  {settingsData!.profile!.isActive && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
                {settingsData!.profile!.biography && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {settingsData!.profile!.biography}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Connected Since</Label>
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(settingsData!.profile!.connectedAt)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Data Refresh Frequency</Label>
                <p className="text-sm text-muted-foreground">Daily at 2:00 AM UTC</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Token Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token Status</Label>
                {settingsData!.token.isValid ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Valid</Badge>
                    {settingsData!.token.expiresAt && (
                      <p className="text-sm text-muted-foreground">
                        Expires in {settingsData!.token.daysRemaining} days
                      </p>
                    )}
                  </div>
                ) : (
                  <Badge variant="destructive" className="text-xs">Invalid</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Auto-Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Tokens are automatically refreshed 7 days before expiration
                </p>
                {settingsData!.token.needsRefresh && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Token will be refreshed soon
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <p className="text-sm text-muted-foreground">
                  {settingsData!.token.expiresAt
                    ? formatTimestamp(settingsData!.token.expiresAt)
                    : "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Last Data Sync</Label>
                <p className="text-sm text-muted-foreground">
                  {settingsData!.sync.lastSyncFormatted}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Data Retention Period</Label>
                <p className="text-sm text-muted-foreground">12 months</p>
              </div>
              <div className="space-y-2">
                <Label>Data Status</Label>
                {settingsData!.sync.hasData ? (
                  <Badge variant="default" className="text-xs">Synced</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">No Data</Badge>
                )}
              </div>
              <form action="/api/sync" method="POST">
                <Button type="submit" variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync Data Now
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
