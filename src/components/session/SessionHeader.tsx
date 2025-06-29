import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface SessionHeaderProps {
  sessionId: string
  onBack: () => void
}

export function SessionHeader({ sessionId, onBack }: SessionHeaderProps) {
  return (
    <div className="mb-8">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold">Data Processing Session</h1>
      <p className="text-muted-foreground mt-2">
        Session ID: <code className="bg-muted px-2 py-1 rounded text-xs">{sessionId}</code>
      </p>
    </div>
  )
}
