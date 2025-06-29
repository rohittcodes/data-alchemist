import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"

interface LoadingStateProps {
  onGoBack: () => void
}

export function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export function SessionNotFoundState({ onGoBack }: LoadingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Session Not Found
          </CardTitle>
          <CardDescription>
            The session you're looking for doesn't exist or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGoBack} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
