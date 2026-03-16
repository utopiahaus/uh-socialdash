import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Settings as SettingsIcon, Instagram, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

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
            <p className="text-sm text-muted-foreground">
              @your_instagram_account
            </p>
          </div>
          <div className="space-y-2">
            <Label>Data Refresh Frequency</Label>
            <p className="text-sm text-muted-foreground">Daily at 2:00 AM</p>
          </div>
          <Button>Reconnect Account</Button>
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
            <Label>Data Retention Period</Label>
            <p className="text-sm text-muted-foreground">12 months</p>
          </div>
          <div className="space-y-2">
            <Label>Last Data Sync</Label>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleString()}
            </p>
          </div>
          <Button variant="outline">Sync Now</Button>
        </CardContent>
      </Card>
    </div>
  )
}
