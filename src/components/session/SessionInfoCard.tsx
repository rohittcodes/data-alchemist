import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SessionInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Information</CardTitle>
        <CardDescription>
          This session will expire in 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>• Files are processed securely and deleted after expiration</p>
          <p>• You can bookmark this page to return to your session</p>
          <p>• Share the session ID to collaborate with others</p>
        </div>
      </CardContent>
    </Card>
  )
}
